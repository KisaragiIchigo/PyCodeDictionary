import { AnalysisResult, SupportedLanguage } from '../types';
import { detectLanguage, parseCode } from './parser/universalParser';
import { parseToAST } from './ast/astParser';
import { getTreeSitterParser, convertTreeSitterNodeToAST } from './ast/treeSitterEngine';
import { SymbolExtractor } from './ast/symbolExtractor';
import { estimateBigO } from './metrics/bigOAnalyzer';
import { calculateMetrics } from './metrics/metricsAnalyzer';
import { generateRefactorSuggestions } from './metrics/refactorAdvisor';
import { resolveMatchedDictEntries } from './dictionary/dictionaryResolver';
import { analyzeArchitecture } from './architecture/cohesionAnalyzer';
import { generateOrchestrationBlueprints } from './architecture/blueprintGenerator';

// Tree-sitter WASM による単一メイン解析経路（世界標準・高精度・構文エラー耐性）
export async function runFullAnalysisAsync(
  code: string,
  fileName: string = 'untitled.py',
  forcedLanguage?: SupportedLanguage
): Promise<AnalysisResult> {
  const language = forcedLanguage || detectLanguage(fileName, code);

  try {
    const parser = await getTreeSitterParser(language);
    if (parser) {
      const tree = parser.parse(code);
      if (tree && tree.rootNode) {
        // 1. Tree-sitter AST ノードツリー生成
        const astRoot = convertTreeSitterNodeToAST(tree.rootNode, code);

        // 2. Tree-sitter シンボル & 呼び出し関係抽出
        const { symbols, callEdges, imports } = SymbolExtractor.extract(tree.rootNode, code, language);

        // 3. 各シンボルの Big-O 計算量推定
        for (const sym of symbols) {
          if (sym.kind === 'function' || sym.kind === 'method') {
            const bigORes = estimateBigO(code, sym);
            sym.bigO = bigORes.complexity;
            sym.bigOReason = bigORes.reason;
          }
        }

        // 4. アーキテクチャ診断と役割分類
        const architectureDiagnoses = analyzeArchitecture(symbols, code, language);
        const blueprints = generateOrchestrationBlueprints(architectureDiagnoses, language);

        // 5. コードメトリクス計算
        const metrics = calculateMetrics(code, language, symbols, imports);
        metrics.orchestratorCount = architectureDiagnoses.filter(d => d.role === 'orchestrator').length;
        metrics.pureLogicCount = architectureDiagnoses.filter(d => d.role === 'pure_logic').length;
        metrics.ioEffectCount = architectureDiagnoses.filter(d => d.role === 'io_effect').length;
        metrics.mixedCount = architectureDiagnoses.filter(d => d.role === 'mixed').length;

        const refactorSuggestions = generateRefactorSuggestions(code, language, symbols, metrics);
        const matchedDictEntries = resolveMatchedDictEntries(code, language, fileName);

        return {
          fileName,
          language,
          code,
          astRoot,
          symbols,
          callEdges,
          imports,
          metrics,
          architectureDiagnoses,
          blueprints,
          refactorSuggestions,
          matchedDictEntries,
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.error(`[Tree-sitter WASM Engine] Parse failed for ${language} (${fileName}):`, err);
  }

  // 万が一のフォールバック
  return runFullAnalysisSyncFallback(code, fileName, language);
}

// 同期フォールバック（初期マウント時・オフライン時用）
export function runFullAnalysis(
  code: string,
  fileName: string = 'untitled.py',
  forcedLanguage?: SupportedLanguage
): AnalysisResult {
  return runFullAnalysisSyncFallback(code, fileName, forcedLanguage);
}

function runFullAnalysisSyncFallback(
  code: string,
  fileName: string = 'untitled.py',
  forcedLanguage?: SupportedLanguage
): AnalysisResult {
  const language = forcedLanguage || detectLanguage(fileName, code);

  const astRoot = parseToAST(code, language);
  const { symbols, callEdges, imports } = parseCode(code, language);

  for (const sym of symbols) {
    if (sym.kind === 'function' || sym.kind === 'method') {
      const bigORes = estimateBigO(code, sym);
      sym.bigO = bigORes.complexity;
      sym.bigOReason = bigORes.reason;
    }
  }

  const architectureDiagnoses = analyzeArchitecture(symbols, code, language);
  const blueprints = generateOrchestrationBlueprints(architectureDiagnoses, language);
  const metrics = calculateMetrics(code, language, symbols, imports);

  metrics.orchestratorCount = architectureDiagnoses.filter(d => d.role === 'orchestrator').length;
  metrics.pureLogicCount = architectureDiagnoses.filter(d => d.role === 'pure_logic').length;
  metrics.ioEffectCount = architectureDiagnoses.filter(d => d.role === 'io_effect').length;
  metrics.mixedCount = architectureDiagnoses.filter(d => d.role === 'mixed').length;

  const refactorSuggestions = generateRefactorSuggestions(code, language, symbols, metrics);
  const matchedDictEntries = resolveMatchedDictEntries(code, language, fileName);

  return {
    fileName,
    language,
    code,
    astRoot,
    symbols,
    callEdges,
    imports,
    metrics,
    architectureDiagnoses,
    blueprints,
    refactorSuggestions,
    matchedDictEntries,
    timestamp: new Date().toISOString()
  };
}
