import {
  ProjectAnalysisResult,
  ProjectFileEntry,
  DictEntry,
  SupportedLanguage
} from '../../types';
import { runFullAnalysis } from '../analyzer';
import { detectLanguage } from '../parser/universalParser';
import { allDictionaries } from '../dictionary/dictionaryResolver';
import { buildProjectDependencyGraph } from './projectGraphBuilder';

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv',
  '.idea', '.vscode', 'coverage', '.next', '.nuxt', 'target', 'bin', 'obj',
  'output', '[output]pydic', '[output]codedictionary'
]);

const VALID_CODE_EXTENSIONS = new Set([
  'py', 'pyw', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'rs', 'go', 'cpp', 'c', 'h', 'hpp', 'sql', 'html', 'css', 'json', 'sh'
]);

export function isCodeFile(fileName: string): boolean {
  const parts = fileName.split('.');
  if (parts.length < 2) return false;
  const ext = parts.pop()?.toLowerCase() || '';
  return VALID_CODE_EXTENSIONS.has(ext);
}

export function isIgnoredPath(relativePath: string): boolean {
  const segments = relativePath.split(/[/\\]/);
  return segments.some(seg => IGNORED_DIRS.has(seg.toLowerCase()));
}

export interface RawFileInput {
  path: string;
  name: string;
  content: string;
}

/**
 * 複数ファイルを一括解析し、プロジェクト全体マップと統合辞書を構築します
 */
export function analyzeProject(
  projectName: string,
  rawFiles: RawFileInput[]
): ProjectAnalysisResult {
  const validFiles = rawFiles.filter(
    f => isCodeFile(f.name) && !isIgnoredPath(f.path)
  );

  const fileEntries: ProjectFileEntry[] = [];
  const projectCustomSymbols: DictEntry[] = [];

  let totalLines = 0;
  let totalCodeLines = 0;
  let totalHealthSum = 0;
  let totalSecurityIssues = 0;
  let totalSymbolCount = 0;

  for (const rf of validFiles) {
    const lang = detectLanguage(rf.name, rf.content);
    const analysis = runFullAnalysis(rf.content, rf.name, lang);

    fileEntries.push({
      path: rf.path,
      name: rf.name,
      language: lang,
      code: rf.content,
      analysis
    });

    totalLines += analysis.metrics.totalLines;
    totalCodeLines += analysis.metrics.codeLines;
    totalHealthSum += analysis.metrics.healthScore;
    totalSecurityIssues += (analysis.metrics.securityIssues?.length || 0);
    totalSymbolCount += analysis.symbols.length;

    // プロジェクト内定義シンボルの辞書化
    for (const sym of analysis.symbols) {
      if (sym.kind === 'function' || sym.kind === 'class' || sym.kind === 'interface' || sym.kind === 'struct') {
        projectCustomSymbols.push({
          term: sym.name,
          language: lang,
          category: 'custom_symbol',
          summary: `${rf.name} 内で定義された ${sym.kind}（L${sym.startLine}）`,
          detailedExplanation: sym.docstring || `${sym.kind} ${sym.name} の定義。引数: [${(sym.parameters || []).join(', ')}]`,
          example: sym.docstring,
          definedInFile: rf.path,
          definedLine: sym.startLine
        });
      }
    }
  }

  const fileCount = fileEntries.length || 1;
  const avgHealth = Math.round(totalHealthSum / fileCount);

  // モジュール依存関係の解決
  const dependencyEdges = buildProjectDependencyGraph(fileEntries);

  // プロジェクト統合マスター辞書（標準辞書 + プロジェクト内定義シンボル）
  const masterDictionary: DictEntry[] = [
    ...projectCustomSymbols,
    ...allDictionaries.python,
    ...allDictionaries.typescript,
    ...allDictionaries.rust,
    ...allDictionaries.go
  ];

  return {
    projectName,
    files: fileEntries,
    dependencyEdges,
    masterDictionary,
    totalMetrics: {
      totalLines,
      codeLines: totalCodeLines,
      fileCount: fileEntries.length,
      symbolCount: totalSymbolCount,
      healthScore: avgHealth,
      securityIssuesCount: totalSecurityIssues
    }
  };
}
