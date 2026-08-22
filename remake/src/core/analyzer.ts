import { AnalysisResult, SupportedLanguage } from '../types';
import { detectLanguage, parseCode } from './parser/universalParser';
import { parseToAST, parseToASTAsync } from './ast/astParser';
import { getTreeSitterParser, convertTreeSitterNodeToAST, extractSymbolsFromTreeSitter } from './ast/treeSitterEngine';
import { estimateBigO } from './metrics/bigOAnalyzer';
import { calculateMetrics } from './metrics/metricsAnalyzer';
import { generateRefactorSuggestions } from './metrics/refactorAdvisor';
import { resolveMatchedDictEntries } from './dictionary/dictionaryResolver';
import { analyzeArchitecture } from './architecture/cohesionAnalyzer';
import { generateOrchestrationBlueprints } from './architecture/blueprintGenerator';

export function runFullAnalysis(
  code: string,
  fileName: string = 'untitled.py',
  forcedLanguage?: SupportedLanguage
): AnalysisResult {
  const language = forcedLanguage || detectLanguage(fileName, code);
  
  // 1. 同期ASTパース
  const astRoot = parseToAST(code, language);

  // 2. シンボル & 呼び出し関係パース
  const { symbols, callEdges, imports } = parseCode(code, language);

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

// Tree-sitter WASM による最高精度の非同期解析
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
        const astRoot = convertTreeSitterNodeToAST(tree.rootNode, code);
        const { symbols, callEdges, imports } = extractSymbolsFromTreeSitter(tree.rootNode, code, language);

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
    }
  } catch (err) {
    console.warn(`Tree-sitter parse failed for ${language}, falling back to built-in parser:`, err);
  }

  // フォールバック
  return runFullAnalysis(code, fileName, language);
}
