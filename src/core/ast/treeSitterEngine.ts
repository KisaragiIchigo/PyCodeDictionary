import { Parser, Language, Node } from 'web-tree-sitter';
import { ASTNode } from '../../types/ast';
import { SymbolNode, CallEdge, PatternTag, ImportEntry, SupportedLanguage } from '../../types';

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

let isInitialized = false;
let initPromise: Promise<void> | null = null;
const languageCache = new Map<SupportedLanguage, Language>();
const parserCache = new Map<SupportedLanguage, Parser>();

export async function initTreeSitter(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await Parser.init({
        locateFile(scriptName: string, _scriptDirectory: string) {
          return `/tree-sitter/${scriptName}`;
        }
      });
      isInitialized = true;
    } catch (err) {
      console.warn('Tree-sitter WASM init warning:', err);
    }
  })();

  return initPromise;
}

export async function getTreeSitterParser(language: SupportedLanguage): Promise<Parser | null> {
  await initTreeSitter();
  if (!isInitialized) return null;

  if (parserCache.has(language)) {
    return parserCache.get(language)!;
  }

  const wasmFile = WASM_FILE_MAP[language];
  if (!wasmFile) return null;

  try {
    let lang = languageCache.get(language);
    if (!lang) {
      lang = await Language.load(`/tree-sitter/${wasmFile}`);
      languageCache.set(language, lang);
    }

    const parser = new Parser();
    parser.setLanguage(lang);
    parserCache.set(language, parser);
    return parser;
  } catch (err) {
    console.warn(`Failed to load Tree-sitter WASM for ${language}:`, err);
    return null;
  }
}

// Tree-sitter Node から アプリ共通 ASTNode への再帰マッピング
export function convertTreeSitterNodeToAST(node: Node, code: string): ASTNode {
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

  // ラベルの見やすさ向上
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

// Tree-sitter による超高精度シンボル & 呼び出し抽出
export function extractSymbolsFromTreeSitter(
  root: Node,
  code: string,
  _language: SupportedLanguage
): {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  imports: ImportEntry[];
} {
  const symbols: SymbolNode[] = [];
  const imports: ImportEntry[] = [];
  const rawCalls: { caller: string; target: string; line: number }[] = [];

  const visit = (node: Node, currentParent: string | null = null, currentFunction: string | null = null) => {
    const type = node.type;
    const startLine = node.startPosition.row + 1;
    const endLine = node.endPosition.row + 1;

    // 1. インポートの抽出
    if (type.includes('import') || type.includes('use_declaration') || type.includes('include_statement')) {
      const importText = code.slice(node.startIndex, node.endIndex);
      imports.push({
        source: importText.slice(0, 40),
        symbols: [importText.slice(0, 30)],
        isStandardLib: !importText.startsWith('.') && !importText.startsWith('/'),
        line: startLine
      });
    }

    // 2. クラス / 構造体 / インターフェース / トレイトの抽出
    if (
      type === 'class_definition' ||
      type === 'class_declaration' ||
      type === 'struct_item' ||
      type === 'type_declaration' ||
      type === 'trait_item'
    ) {
      const nameNode = node.childForFieldName('name') || node.children.find((c: Node) => c.type.includes('identifier'));
      const name = nameNode ? code.slice(nameNode.startIndex, nameNode.endIndex) : 'AnonymousClass';
      const kind = type.includes('struct') ? 'struct' : type.includes('trait') || type.includes('interface') ? 'interface' : 'class';

      symbols.push({
        id: `class-${name}`,
        name,
        kind,
        startLine,
        endLine,
        tags: [],
        calls: []
      });

      // 子要素の走査
      for (let i = 0; i < node.namedChildCount; i++) {
        visit(node.namedChild(i)!, name, currentFunction);
      }
      return;
    }

    // 3. 関数 / メソッド定義の抽出
    if (
      type === 'function_definition' ||
      type === 'function_declaration' ||
      type === 'function_item' ||
      type === 'method_definition' ||
      type === 'method_declaration' ||
      type === 'arrow_function'
    ) {
      const nameNode = node.childForFieldName('name') || node.children.find((c: Node) => c.type === 'identifier' || c.type === 'field_identifier');
      let funcName = nameNode ? code.slice(nameNode.startIndex, nameNode.endIndex) : '';

      if (!funcName && type === 'arrow_function') {
        const parentDecl = node.parent;
        if (parentDecl && parentDecl.childForFieldName('name')) {
          const pName = parentDecl.childForFieldName('name')!;
          funcName = code.slice(pName.startIndex, pName.endIndex);
        }
      }

      if (funcName) {
        const isMethod = currentParent !== null;
        const fullName = isMethod ? `${currentParent}.${funcName}` : funcName;

        const paramsNode = node.childForFieldName('parameters') || node.childForFieldName('params');
        const params: string[] = [];
        if (paramsNode) {
          for (let p = 0; p < paramsNode.namedChildCount; p++) {
            const pChild = paramsNode.namedChild(p)!;
            params.push(code.slice(pChild.startIndex, pChild.endIndex));
          }
        }

        const tags: PatternTag[] = [];
        const bodyText = code.slice(node.startIndex, node.endIndex);
        if (bodyText.includes('async ') || bodyText.includes('await ')) tags.push('async');
        if (bodyText.includes('yield ') || bodyText.includes('yield*')) tags.push('generator');
        if (/fetch|axios|http|requests|reqwest|net\./.test(bodyText)) tags.push('net');
        if (/fs\.|open\(|File::|read_to_string|os\.ReadFile|std::ifstream/.test(bodyText)) tags.push('io');

        symbols.push({
          id: fullName,
          name: fullName,
          kind: isMethod ? 'method' : 'function',
          parentName: currentParent || undefined,
          startLine,
          endLine,
          parameters: params,
          tags,
          calls: []
        });

        // 関数本体の走査
        for (let i = 0; i < node.namedChildCount; i++) {
          visit(node.namedChild(i)!, currentParent, fullName);
        }
        return;
      }
    }

    // 4. 関数呼び出し (CallExpression / Call)
    if (type === 'call_expression' || type === 'call' || type === 'method_invocation') {
      const funcNode = node.childForFieldName('function') || node.children[0];
      if (funcNode) {
        let calleeName = code.slice(funcNode.startIndex, funcNode.endIndex);
        if (calleeName.includes('.')) calleeName = calleeName.split('.').pop()!;
        if (calleeName.includes('::')) calleeName = calleeName.split('::').pop()!;

        if (currentFunction) {
          rawCalls.push({
            caller: currentFunction,
            target: calleeName,
            line: startLine
          });
        }
      }
    }

    // 子ノード走査
    for (let i = 0; i < node.namedChildCount; i++) {
      visit(node.namedChild(i)!, currentParent, currentFunction);
    }
  };

  visit(root);

  // 呼び出しグラフの解決
  const callEdgesMap = new Map<string, CallEdge>();
  for (const call of rawCalls) {
    const callerSym = symbols.find(s => s.name === call.caller);
    let targetSym = symbols.find(s => s.name === call.target || s.name.endsWith(`.${call.target}`) || s.name.endsWith(`::${call.target}`));

    if (targetSym) {
      if (callerSym && !callerSym.calls.includes(targetSym.name)) {
        callerSym.calls.push(targetSym.name);
      }

      const edgeKey = `${call.caller}->${targetSym.name}`;
      if (!callEdgesMap.has(edgeKey)) {
        callEdgesMap.set(edgeKey, {
          id: `edge-${edgeKey}`,
          source: call.caller,
          target: targetSym.name,
          sourceName: call.caller,
          targetName: targetSym.name,
          count: 1,
          lines: [call.line]
        });
      } else {
        const edge = callEdgesMap.get(edgeKey)!;
        edge.count++;
        if (!edge.lines.includes(call.line)) edge.lines.push(call.line);
      }
    }
  }

  return {
    symbols: symbols.sort((a, b) => a.startLine - b.startLine),
    callEdges: Array.from(callEdgesMap.values()),
    imports
  };
}
