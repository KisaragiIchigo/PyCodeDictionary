import { ASTNode } from '../../types/ast';
import { SupportedLanguage } from '../../types';
import { buildPythonAST } from './pythonAstBuilder';
import { buildTsJsAST } from './tsJsAstBuilder';

export function parseToAST(code: string, language: SupportedLanguage): ASTNode {
  switch (language) {
    case 'python':
      return buildPythonAST(code);
    case 'typescript':
    case 'javascript':
      return buildTsJsAST(code);
    default:
      // Rust, Go, C++, SQL 等向けの汎用ASTビルダー
      return buildGenericAST(code, language);
  }
}

function buildGenericAST(code: string, language: SupportedLanguage): ASTNode {
  const lines = code.split('\n');
  const rootNode: ASTNode = {
    id: `generic-ast-root`,
    type: 'TranslationUnit',
    label: `TranslationUnit (${language.toUpperCase()} Root)`,
    category: 'module',
    loc: {
      start: { line: 1, column: 0 },
      end: { line: lines.length, column: lines[lines.length - 1]?.length || 0 }
    },
    attributes: {
      language
    },
    children: []
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('#')) {
      continue;
    }

    // 関数/構造体/マクロの判定
    let type = 'Statement';
    let category: ASTNode['category'] = 'statement';

    if (/\b(fn|func|def|void|int|auto)\s+([a-zA-Z_]\w*)\s*\(/.test(trimmed)) {
      type = 'FunctionDefinition';
      category = 'declaration';
    } else if (/\b(struct|class|enum|trait|type)\s+([a-zA-Z_]\w*)/.test(trimmed)) {
      type = 'TypeDeclaration';
      category = 'declaration';
    } else if (/\b(if|for|while|match|switch|select)\b/.test(trimmed)) {
      type = 'ControlStatement';
      category = 'statement';
    }

    rootNode.children.push({
      id: `gen-ast-${lineNum}`,
      type,
      label: `${type}: ${trimmed.slice(0, 40)}`,
      category,
      loc: {
        start: { line: lineNum, column: 0 },
        end: { line: lineNum, column: rawLine.length }
      },
      attributes: {
        codeSnippet: trimmed
      },
      children: []
    });
  }

  return rootNode;
}
