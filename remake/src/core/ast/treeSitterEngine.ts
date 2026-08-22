import type { Parser as ParserType, Language as LanguageType, Node as NodeType } from 'web-tree-sitter';
import { ASTNode } from '../../types/ast';
import { SupportedLanguage } from '../../types';

// 言語ごとの Tree-sitter WASM ファイル名マッピング
const WASM_FILE_MAP: Partial<Record<SupportedLanguage, string>> = {
  python: 'tree-sitter-python.wasm',
  typescript: 'tree-sitter-typescript.wasm',
  javascript: 'tree-sitter-javascript.wasm',
  rust: 'tree-sitter-rust.wasm',
  go: 'tree-sitter-go.wasm',
  cpp: 'tree-sitter-cpp.wasm',
  html: 'tree-sitter-html.wasm',
  css: 'tree-sitter-css.wasm',
  json: 'tree-sitter-json.wasm',
  shell: 'tree-sitter-bash.wasm'
};

let ParserModule: any = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;
const languageCache = new Map<SupportedLanguage, LanguageType>();
const parserCache = new Map<SupportedLanguage, ParserType>();

// WASM パス解決（ブラウザ / Electron / Vite 本番環境対応）
function getWasmPath(fileName: string): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const base = pathname.endsWith('/') ? pathname : pathname.substring(0, pathname.lastIndexOf('/') + 1);
    return `${origin}${base}tree-sitter/${fileName}`;
  }
  return `/tree-sitter/${fileName}`;
}

export async function initTreeSitter(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 動的インポートにより、ブラウザ静的読み込み時のモジュール衝突を完全回避
      const mod = await import('web-tree-sitter');
      ParserModule = mod.default || mod.Parser || mod;

      if (ParserModule && typeof ParserModule.init === 'function') {
        await ParserModule.init({
          locateFile(scriptName: string) {
            // web-tree-sitter.wasm または tree-sitter.wasm を安全にマップ
            if (scriptName.includes('web-tree-sitter') || scriptName.includes('tree-sitter')) {
              return getWasmPath('tree-sitter.wasm');
            }
            return getWasmPath(scriptName);
          }
        });
        isInitialized = true;
        console.log('[Tree-sitter WASM] Core initialized successfully.');
      }
    } catch (err) {
      console.warn('[Tree-sitter WASM] Init failed, running in resilient fallback mode:', err);
    }
  })();

  return initPromise;
}

export async function getTreeSitterParser(language: SupportedLanguage): Promise<ParserType | null> {
  await initTreeSitter();
  if (!isInitialized || !ParserModule) return null;

  if (parserCache.has(language)) {
    return parserCache.get(language)!;
  }

  const wasmFile = WASM_FILE_MAP[language];
  if (!wasmFile) return null;

  try {
    let lang = languageCache.get(language);
    if (!lang) {
      const wasmUrl = getWasmPath(wasmFile);
      const LanguageClass = ParserModule.Language || ParserModule;
      if (typeof LanguageClass.load === 'function') {
        const loadedLang = await LanguageClass.load(wasmUrl);
        if (loadedLang) {
          lang = loadedLang;
          languageCache.set(language, loadedLang);
        }
      }
    }

    if (lang) {
      const parser = new ParserModule();
      parser.setLanguage(lang);
      parserCache.set(language, parser);
      return parser;
    }
  } catch (err) {
    console.warn(`[Tree-sitter WASM] Failed to load grammar for ${language}:`, err);
  }

  return null;
}

// Tree-sitter Node から アプリ共通 ASTNode への再帰マッピング
export function convertTreeSitterNodeToAST(node: NodeType, code: string): ASTNode {
  const type = node.type;
  const isNamed = node.isNamed;

  let category: ASTNode['category'] = 'expression';
  if (type.includes('module') || type.includes('program') || type.includes('translation_unit') || type.includes('source_file')) {
    category = 'module';
  } else if (type.includes('declaration') || type.includes('definition') || type.includes('specifier') || type.includes('item')) {
    category = 'declaration';
  } else if (type.includes('statement') || type.includes('clause') || type.includes('import') || type.includes('block')) {
    category = 'statement';
  }

  const textSnippet = code.slice(node.startIndex, node.endIndex);
  let label = type;

  if (node.childForFieldName('name')) {
    const nameNode = node.childForFieldName('name')!;
    label = `${type}: ${code.slice(nameNode.startIndex, nameNode.endIndex)}`;
  } else if (type === 'identifier' || type === 'type_identifier' || type === 'string' || type === 'number') {
    label = `${type} (${textSnippet.slice(0, 25)})`;
  } else if (type.includes('call') || type.includes('expression')) {
    label = `${type}: ${textSnippet.slice(0, 30)}`;
  }

  const children: ASTNode[] = [];
  for (let i = 0; i < node.namedChildCount; i++) {
    const child = node.namedChild(i);
    if (child) {
      children.push(convertTreeSitterNodeToAST(child, code));
    }
  }

  return {
    id: `tsitter-${node.id}`,
    type,
    label,
    category,
    loc: {
      start: { line: node.startPosition.row + 1, column: node.startPosition.column },
      end: { line: node.endPosition.row + 1, column: node.endPosition.column }
    },
    attributes: {
      isNamed,
      hasError: node.hasError,
      text: textSnippet.length <= 60 ? textSnippet : textSnippet.slice(0, 60) + '...'
    },
    children
  };
}
