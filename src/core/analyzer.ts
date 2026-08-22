import { AnalysisResult, SupportedLanguage } from '../types';
import { detectLanguage, parseCode } from './parser/universalParser';
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
  const { symbols, callEdges, imports } = parseCode(code, language);
  
  // アーキテクチャ診断と役割分類
  const architectureDiagnoses = analyzeArchitecture(symbols, code, language);
  const blueprints = generateOrchestrationBlueprints(architectureDiagnoses, language);

  const metrics = calculateMetrics(code, language, symbols, imports);

  // 役割カウントの反映
  metrics.orchestratorCount = architectureDiagnoses.filter(d => d.role === 'orchestrator').length;
  metrics.pureLogicCount = architectureDiagnoses.filter(d => d.role === 'pure_logic').length;
  metrics.ioEffectCount = architectureDiagnoses.filter(d => d.role === 'io_effect').length;
  metrics.mixedCount = architectureDiagnoses.filter(d => d.role === 'mixed').length;

  const refactorSuggestions = generateRefactorSuggestions(code, language, symbols, metrics);
  const matchedDictEntries = resolveMatchedDictEntries(code, language);

  return {
    fileName,
    language,
    code,
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
