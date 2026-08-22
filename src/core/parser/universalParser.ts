import { SupportedLanguage, SymbolNode, CallEdge, ImportEntry } from '../../types';
import { parsePythonCode } from './pythonParser';
import { parseTsJsCode } from './tsJsParser';
import { parseRustCode } from './rustParser';
import { parseGoCode } from './goParser';
import { parseGenericCode } from './genericParser';

export function detectLanguage(fileName: string, code: string): SupportedLanguage {
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';

  switch (ext) {
    case 'py':
    case 'pyw':
    case 'pyi':
      return 'python';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'cpp':
    case 'cxx':
    case 'cc':
    case 'c':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'sql':
      return 'sql';
    case 'json':
      return 'json';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
  }

  if (code.startsWith('#!') && code.includes('python')) return 'python';
  if (code.startsWith('#!') && (code.includes('bash') || code.includes('sh'))) return 'shell';
  if (/def\s+[A-Za-z0-9_]+\s*\(|import\s+[A-Za-z0-9_]+|class\s+[A-Za-z0-9_]+:/.test(code)) return 'python';
  if (/interface\s+[A-Za-z0-9_]+|const\s+[A-Za-z0-9_]+:\s*|import\s+React/.test(code)) return 'typescript';
  if (/fn\s+[A-Za-z0-9_]+|let\s+mut\s+|impl\s+[A-Za-z0-9_]+/.test(code)) return 'rust';
  if (/func\s+(?:\(.*?\)\s+)?[A-Za-z0-9_]+\(|package\s+main/.test(code)) return 'go';
  if (/SELECT\s+.*?\s+FROM\s+/i.test(code)) return 'sql';

  return 'python';
}

export function parseCode(
  code: string,
  language: SupportedLanguage
): {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  imports: ImportEntry[];
} {
  switch (language) {
    case 'python':
      return parsePythonCode(code);
    case 'typescript':
    case 'javascript':
      return parseTsJsCode(code);
    case 'rust':
      return parseRustCode(code);
    case 'go':
      return parseGoCode(code);
    default:
      return parseGenericCode(code, language);
  }
}
