import { SymbolNode, ArchitectureDiagnosis, SupportedLanguage } from '../../types';
import { classifyFunctionRole } from './roleClassifier';

export function analyzeArchitecture(
  symbols: SymbolNode[],
  code: string,
  language: SupportedLanguage
): ArchitectureDiagnosis[] {
  const executableSymbols = symbols.filter(
    s => s.kind === 'function' || s.kind === 'method'
  );

  const diagnoses: ArchitectureDiagnosis[] = [];

  for (const sym of executableSymbols) {
    const res = classifyFunctionRole(sym, code);

    // 単一責任度スコア（Cohesion Score 0-100）
    let cohesion = 100;
    if (res.responsibilities.length > 1) {
      cohesion -= (res.responsibilities.length - 1) * 25;
    }
    const lineCount = sym.endLine - sym.startLine + 1;
    if (lineCount > 30) {
      cohesion -= Math.min(30, (lineCount - 30) * 1.5);
    }
    cohesion = Math.max(20, Math.min(100, Math.round(cohesion)));

    // シンボル自身に role を設定
    sym.architectureRole = res.role;

    diagnoses.push({
      symbolName: sym.name,
      role: res.role,
      roleConfidence: res.confidence,
      cohesionScore: cohesion,
      detectedResponsibilities: res.responsibilities,
      isOverloaded: res.isOverloaded,
      refactorAdvice: res.advice,
      proposedSteps: res.proposedSteps
    });
  }

  return diagnoses;
}
