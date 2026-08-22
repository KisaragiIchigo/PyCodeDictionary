import { RefactorSuggestion, SupportedLanguage, SymbolNode, CodeMetrics } from '../../types';

export function generateRefactorSuggestions(
  code: string,
  language: SupportedLanguage,
  symbols: SymbolNode[],
  metrics: CodeMetrics
): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];

  // 1. 深いネストに対するガード節（早期リターン）の提案
  if (metrics.maxNestingDepth >= 3) {
    suggestions.push({
      id: 'sug-guard-clause',
      title: 'ガード節（早期リターン）によるネスト階層の平坦化',
      description: '深い if ブロックの入れ子を解消するため、前提条件を満たさない場合は先頭で即座に return / throw / continue するガード節を適用してください。',
      codeBefore: '// Before: 深い入れ子\nif (user != null) {\n    if (user.isActive) {\n        if (hasPermission) {\n            executeTask();\n        }\n    }\n}',
      codeAfter: '// After: フラットなガード節\nif (user == null || !user.isActive || !hasPermission) {\n    return;\n}\nexecuteTask();',
      impact: 'high'
    });
  }

  // 2. 長い関数に対する責務分離・サブルーチン抽出提案
  const longFuncs = symbols.filter(
    s => (s.kind === 'function' || s.kind === 'method') && (s.endLine - s.startLine) > 35
  );

  for (const fn of longFuncs) {
    suggestions.push({
      id: `sug-extract-method-${fn.name}`,
      title: `関数 '${fn.name}' のオーケストレーション化と処理分割`,
      description: `行数が長くなっています。入力検証、データ変換、副作用実行の各ステップを独立した純粋関数（Pure Function）へ切り出し、本体はそれらを宣言順に呼び出すオーケストレータに集中させましょう。`,
      targetSymbol: fn.name,
      line: fn.startLine,
      impact: 'medium'
    });
  }

  // 3. 言語固有のリファクタリング提案
  if (language === 'python') {
    if (code.includes('.append(') && code.includes('for ')) {
      suggestions.push({
        id: 'sug-py-comprehension',
        title: 'リスト内包表記（List Comprehension）の活用',
        description: '空リストを作成して for ループで append する処理は、内包表記を使うことでより高速かつ宣言的に記述できます。',
        codeBefore: '# Before\nresult = []\nfor item in items:\n    if item.is_valid:\n        result.append(item.value)',
        codeAfter: '# After\nresult = [item.value for item in items if item.is_valid]',
        impact: 'low'
      });
    }

    if (code.includes('global ')) {
      suggestions.push({
        id: 'sug-py-global',
        title: 'global 文の排除と状態のカプセル化',
        description: 'モジュールレベルのグローバル変数の再バインドは予期せぬ副作用の原因となります。クラスのプロパティまたは関数の引数・戻り値で状態を明示的に受け渡しましょう。',
        impact: 'high'
      });
    }
  }

  if (language === 'typescript' || language === 'javascript') {
    if (code.includes('var ')) {
      suggestions.push({
        id: 'sug-js-const-let',
        title: 'var 宣言の const / let への置き換え',
        description: '関数スコープを持つ古い var 宣言は変数巻き上げ（Hoisting）のバグを誘発します。すべて const（再代入がある場合のみ let）へ置き換えてください。',
        impact: 'high'
      });
    }

    if (/await\s+.*?\n\s*await\s+/.test(code)) {
      suggestions.push({
        id: 'sug-js-parallel-await',
        title: '独立した非同期処理の Promise.all 並列化',
        description: '依存関係のない連続した await 呼び出しは、直列実行されてレイテンシが悪化します。Promise.all または Promise.allSettled による並列実行を検討してください。',
        codeBefore: '// Before: 直列実行\nconst user = await fetchUser();\nconst config = await fetchConfig();',
        codeAfter: '// After: 並列実行\nconst [user, config] = await Promise.all([\n    fetchUser(),\n    fetchConfig()\n]);',
        impact: 'medium'
      });
    }
  }

  return suggestions;
}
