import { SymbolNode, SupportedLanguage } from '../../types';

export type BigOComplexity = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n^2)' | 'O(n^3)' | 'O(2^n)';

export interface BigOResult {
  complexity: BigOComplexity;
  reason: string;
  bottlenecks: { line: number; description: string }[];
}

export function estimateBigO(code: string, sym: SymbolNode): BigOResult {
  const lines = code.split('\n');
  const funcLines = lines.slice(Math.max(0, sym.startLine - 1), sym.endLine);
  const funcCode = funcLines.join('\n');

  const bottlenecks: { line: number; description: string }[] = [];

  // 1. 再帰関数の検知 -> O(2^n) または O(n)
  if (sym.tags.includes('recursive')) {
    bottlenecks.push({
      line: sym.startLine,
      description: '自己再帰呼び出しを検知（分割統治または指数的計算量の可能性）'
    });

    const isBranchingRecursion = (funcCode.match(new RegExp(`\\b${sym.name}\\(`, 'g')) || []).length >= 2;
    if (isBranchingRecursion && !sym.tags.includes('memoized')) {
      return {
        complexity: 'O(2^n)',
        reason: 'メモ化されていない多重再帰呼び出し（フィボナッチ型など）',
        bottlenecks
      };
    }
    return {
      complexity: 'O(n)',
      reason: '単一再帰（線形走査）',
      bottlenecks
    };
  }

  // 2. ネストループの深さ検知
  let maxLoopDepth = 0;
  let currentLoopDepth = 0;

  for (let i = 0; i < funcLines.length; i++) {
    const line = funcLines[i];
    const lineNum = sym.startLine + i;

    if (/\b(for|while)\b/.test(line)) {
      currentLoopDepth++;
      if (currentLoopDepth > maxLoopDepth) {
        maxLoopDepth = currentLoopDepth;
      }
      if (currentLoopDepth >= 2) {
        bottlenecks.push({
          line: lineNum,
          description: `ネストループ (深さ ${currentLoopDepth}): O(n^${currentLoopDepth}) のボトルネック`
        });
      }
    }
    if (line.includes('}') || (line.search(/\S/) === 0 && i > 0)) {
      currentLoopDepth = Math.max(0, currentLoopDepth - 1);
    }
  }

  if (maxLoopDepth >= 3) {
    return {
      complexity: 'O(n^3)',
      reason: `3重以上のネストループを検出（データ増大時に急速に遅延するリスク）`,
      bottlenecks
    };
  }

  if (maxLoopDepth === 2) {
    return {
      complexity: 'O(n^2)',
      reason: `2重ネストループを検出（全探索または二重走査）`,
      bottlenecks
    };
  }

  if (maxLoopDepth === 1) {
    if (/\.sort\(|\.sorted\(|sort\.Slice/.test(funcCode)) {
      return {
        complexity: 'O(n log n)',
        reason: 'ソート処理および1重ループを含む計算',
        bottlenecks
      };
    }
    return {
      complexity: 'O(n)',
      reason: '1重ループによる線形走査',
      bottlenecks
    };
  }

  if (/\.sort\(|\.sorted\(|sort\.Slice/.test(funcCode)) {
    return {
      complexity: 'O(n log n)',
      reason: '内部ソートアルゴリズム（Timsort / Quicksort 等）',
      bottlenecks
    };
  }

  // 3. ループなし・辞書/ハッシュ参照・計算
  return {
    complexity: 'O(1)',
    reason: '定数時間で完了する処理（ハッシュマップ参照、直接計算、ガード節）',
    bottlenecks: []
  };
}
