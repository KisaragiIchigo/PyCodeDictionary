import { CodeMetrics, QualityIssue, SupportedLanguage, SymbolNode, ImportEntry } from '../../types';
import { scanSecurityIssues } from './securityScanner';
import { calculateCognitiveComplexity } from './cognitiveComplexity';

export function calculateMetrics(
  code: string,
  language: SupportedLanguage,
  symbols: SymbolNode[],
  imports: ImportEntry[] = []
): CodeMetrics {
  const lines = code.split('\n');
  const totalLines = lines.length;

  let commentLines = 0;
  let blankLines = 0;
  let codeLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blankLines++;
    } else if (
      trimmed.startsWith('#') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('--')
    ) {
      commentLines++;
    } else {
      codeLines++;
    }
  }

  // 1. 循環的複雑度 (Cyclomatic Complexity)
  let complexity = 1;
  const branchKeywords = [
    /\bif\b/g,
    /\belif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\bexcept\b/g,
    /&&/g,
    /\|\|/g,
    /\band\b/g,
    /\bor\b/g,
    /\?/g
  ];

  for (const line of lines) {
    for (const kw of branchKeywords) {
      const matches = line.match(kw);
      if (matches) {
        complexity += matches.length;
      }
    }
  }

  // 2. 認知複雑度 (Cognitive Complexity)
  const cognitiveComplexity = calculateCognitiveComplexity(code, language);

  // 3. 最大ネスト深度
  let maxNestingDepth = 0;
  let currentIndentDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    if (language === 'python') {
      const match = line.match(/^(\s*)/);
      const spaces = match ? match[1].length : 0;
      const depth = Math.floor(spaces / 4);
      if (depth > maxNestingDepth) maxNestingDepth = depth;
    } else {
      for (const char of line) {
        if (char === '{') currentIndentDepth++;
        if (char === '}') currentIndentDepth = Math.max(0, currentIndentDepth - 1);
        if (currentIndentDepth > maxNestingDepth) maxNestingDepth = currentIndentDepth;
      }
    }
  }

  // 4. 品質 & スタイル課題の検出
  const issues: QualityIssue[] = [];

  // 長すぎる関数
  for (const sym of symbols) {
    if (sym.kind === 'function' || sym.kind === 'method') {
      const length = sym.endLine - sym.startLine + 1;
      if (length > 35) {
        issues.push({
          id: `issue-long-func-${sym.name}`,
          line: sym.startLine,
          severity: 'warning',
          rule: 'max-function-lines',
          message: `関数/メソッド '${sym.name}' の行数が ${length} 行あります（推奨: 30行以内）。`,
          suggestion: '単一責任の原則に従い、処理のフェーズごとに純粋関数へ分割してください。'
        });
      }
    }
  }

  // 深すぎるネスト
  if (maxNestingDepth >= 4) {
    issues.push({
      id: 'issue-nesting-depth',
      line: 1,
      severity: 'warning',
      rule: 'max-depth',
      message: `コード内の最大ネスト深度が ${maxNestingDepth} 階層に達しています。`,
      suggestion: 'ガード節（早期リターン: if (!cond) return;）を活用して階層をフラットに保ちましょう。'
    });
  }

  // 未使用インポートの検知
  for (const imp of imports) {
    for (const sym of imp.symbols) {
      if (sym === '*' || sym.includes('{')) continue;
      const regex = new RegExp(`\\b${sym}\\b`, 'g');
      const matches = code.match(regex) || [];
      // インポート行以外で使われていない場合
      if (matches.length <= 1) {
        issues.push({
          id: `issue-unused-import-${sym}`,
          line: imp.line,
          severity: 'info',
          rule: 'unused-import',
          message: `インポートされた '${sym}' はコード内で使用されていない可能性があります。`,
          suggestion: '不要なインポートを削除して依存関係とバンドルサイズをスリム化してください。'
        });
      }
    }
  }

  // 5. セキュリティ脆弱性スキャン
  const securityIssues = scanSecurityIssues(code, language);

  let securityScore = 100;
  securityScore -= securityIssues.filter(s => s.severity === 'critical').length * 35;
  securityScore -= securityIssues.filter(s => s.severity === 'high').length * 20;
  securityScore -= securityIssues.filter(s => s.severity === 'medium').length * 10;
  securityScore = Math.max(0, Math.min(100, securityScore));

  // 6. 保守性指標 & ヘルススコア
  const rawMI = 100 - (complexity * 0.7) - (cognitiveComplexity * 0.5) - (maxNestingDepth * 3) - (issues.length * 2);
  const maintainabilityIndex = Math.max(10, Math.min(100, Math.round(rawMI)));

  let healthScore = 100;
  healthScore -= issues.filter(i => i.severity === 'error').length * 15;
  healthScore -= issues.filter(i => i.severity === 'warning').length * 6;
  healthScore -= issues.filter(i => i.severity === 'info').length * 2;
  healthScore -= (100 - securityScore) * 0.3;
  if (cognitiveComplexity > 15) healthScore -= (cognitiveComplexity - 15) * 0.5;
  healthScore = Math.max(20, Math.min(100, Math.round(healthScore)));

  const functionCount = symbols.filter(s => s.kind === 'function' || s.kind === 'method').length;
  const classCount = symbols.filter(s => s.kind === 'class' || s.kind === 'struct' || s.kind === 'interface').length;

  const orchestratorCount = symbols.filter(s => s.architectureRole === 'orchestrator').length;
  const pureLogicCount = symbols.filter(s => s.architectureRole === 'pure_logic').length;
  const ioEffectCount = symbols.filter(s => s.architectureRole === 'io_effect').length;
  const mixedCount = symbols.filter(s => s.architectureRole === 'mixed').length;

  return {
    totalLines,
    codeLines,
    commentLines,
    blankLines,
    cyclomaticComplexity: complexity,
    cognitiveComplexity,
    maxNestingDepth,
    functionCount,
    classCount,
    orchestratorCount,
    pureLogicCount,
    ioEffectCount,
    mixedCount,
    healthScore,
    securityScore,
    maintainabilityIndex,
    issues,
    securityIssues
  };
}
