import { SupportedLanguage } from '../../types';

/**
 * SonarQube準拠の認知複雑度 (Cognitive Complexity) 計算エンジン
 * ネストの深さに応じて分岐にペナルティを加算し、人間の読みやすさ・認知負荷を評価
 */
export function calculateCognitiveComplexity(code: string, language: SupportedLanguage): number {
  const lines = code.split('\n');
  let totalCognitive = 0;
  let nestingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      continue;
    }

    // インデント / 括弧に基づくネストレベルの追跡
    if (language === 'python') {
      const match = line.match(/^(\s*)/);
      const spaces = match ? match[1].length : 0;
      nestingLevel = Math.floor(spaces / 4);
    } else {
      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;
      if (closeCount > 0) {
        nestingLevel = Math.max(0, nestingLevel - closeCount);
      }
    }

    // 認知負荷を生じる構文（if, for, while, catch, switch, ternary）
    const isControlStructure = /\b(?:if|elif|else\s+if|for|while|catch|except)\b/.test(trimmed);
    const hasTernary = /\?.*?:/.test(trimmed);
    const hasLogicalChaining = /(&&|\|\||\band\b|\bor\b)/.test(trimmed);

    if (isControlStructure || hasTernary) {
      // 構造自体に +1、ネスト深度に応じて +nestingLevel
      totalCognitive += 1 + Math.max(0, nestingLevel - 1);
    }

    if (hasLogicalChaining) {
      totalCognitive += 1;
    }

    // 再帰や早期脱出（break/continue）
    if (/\b(?:break|continue)\b/.test(trimmed)) {
      totalCognitive += 1;
    }

    if (language !== 'python') {
      const openCount = (line.match(/\{/g) || []).length;
      nestingLevel += openCount;
    }
  }

  return totalCognitive;
}
