import { InteractiveExplanation } from '../../../types';

export const jsTsInteractiveMap: Record<string, InteractiveExplanation> = {
  interface: {
    anatomy: {
      title: 'TypeScript Interface（型契約）の構文解剖',
      description: 'オブジェクトの形状（プロパティ、メソッド、オプショナル型）を定義する契約構文です。',
      codeTemplate: 'interface UserProfile extends BaseEntity { id: string; name?: string; }',
      tokens: [
        { text: 'interface', role: 'インターフェース定義', explanation: 'オブジェクト構造の型定義を宣言するキーワードです。', type: 'keyword' },
        { text: 'UserProfile', role: '型識別子', explanation: 'PascalCaseで命名されたインターフェース名です。', type: 'identifier' },
        { text: 'extends BaseEntity', role: '型拡張 (継承)', explanation: 'BaseEntityの全プロパティを継承して拡張します。', type: 'type' },
        { text: '{', role: '定義開始', explanation: 'メンバ定義ブロックを開始します。', type: 'punctuation' },
        { text: 'id: string;', role: '必須プロパティ', explanation: 'string型の必須プロパティです。', type: 'param' },
        { text: 'name?: string;', role: 'オプショナルプロパティ', explanation: '?が付いており、undefinedでも許容されます。', type: 'param' },
        { text: '}', role: '定義終了', explanation: 'インターフェース定義を閉じます。', type: 'punctuation' }
      ]
    },
    playgroundDefaultCode: `interface CodeMetric {
  name: string;
  score: number;
  isPassing?: boolean;
}

function evaluateMetric(metric: CodeMetric): string {
  const passing = metric.isPassing ?? (metric.score >= 80);
  return \`[\${metric.name}] スコア: \${metric.score} -> \${passing ? '合格 (PASS)' : '要改善 (WARN)'}\`;
}

console.log(evaluateMetric({ name: "循環的複雑度", score: 92 }));
console.log(evaluateMetric({ name: "セキュリティ診断", score: 65 }));`,
    conceptSim: {
      type: 'generic_flow',
      title: 'Interface vs Type Alias の違い',
      description: 'interfaceの宣言結合（Declaration Merging）とtypeのユニオン型/交差型の特徴を図解します。',
      defaultMode: 'interface_merge',
      modes: [
        { id: 'interface_merge', label: 'Interface宣言結合', description: '同名interfaceを複数回書くと自動でプロパティが合成されます（拡張性が高い）。' },
        { id: 'type_union', label: 'Type Aliasユニオン', description: 'type X = A | B のような共用体やプリミティブの別名定義に向いています。' }
      ]
    },
    quiz: {
      question: 'TypeScriptで、プロパティを後からオプショナル（省略可能）に指定する記号は？',
      options: [
        { id: 'a', text: '?', isCorrect: true, explanation: '正解！name?: string のようにプロパティ名の後ろに ? を付けるとオプショナルになります。' },
        { id: 'b', text: '!', isCorrect: false, explanation: '誤りです。! は Non-null assertion operator（nullでないことの断定）に使われます。' },
        { id: 'c', text: '~', isCorrect: false, explanation: '誤りです。~ はビット否定演算子です。' }
      ]
    }
  },

  async: {
    anatomy: {
      title: 'JavaScript/TypeScript async/await 構文解剖',
      description: 'Promiseベースの非同期処理を同期処理のように直感的に記述できる構文です。',
      codeTemplate: 'async function loadData(url: string): Promise<ApiResponse>',
      tokens: [
        { text: 'async', role: '非同期修飾子', explanation: '関数の戻り値を自動的にPromiseでラップします。', type: 'keyword' },
        { text: 'function', role: '関数宣言', explanation: '標準の関数定義キーワードです。', type: 'keyword' },
        { text: 'loadData', role: '関数名', explanation: '非同期関数の識別子です。', type: 'identifier' },
        { text: '(url: string)', role: '引数', explanation: 'APIエンドポイントURL文字列です。', type: 'param' },
        { text: ': Promise<ApiResponse>', role: '戻り値型', explanation: 'ApiResponseを含むPromiseを返します。', type: 'return' }
      ]
    },
    playgroundDefaultCode: `async function fetchMockUser(id) {
  console.log(\`ユーザーID: \${id} を取得中...\`);
  // 非同期の遅延をシミュレート
  return { id, name: "Alice", role: "Architect", active: true };
}

async function main() {
  const user = await fetchMockUser(42);
  console.log("取得結果:", user);
  return user.name;
}

main();`,
    conceptSim: {
      type: 'async_timeline',
      title: 'Promise.all vs 順次 await タイムライン',
      description: '独立した複数の非同期処理を Promise.all で並列化した場合の所要時間短縮を図解します。',
      defaultMode: 'parallel',
      modes: [
        { id: 'serial', label: '順次 await', description: 'Task 1 (300ms) -> Task 2 (200ms) = 合計 500ms' },
        { id: 'parallel', label: 'Promise.all 並行', description: 'Task 1 と Task 2 を同時に開始 = 最長 300ms で完了！' }
      ]
    },
    quiz: {
      question: 'async 関数が常に返すオブジェクトの型は？',
      options: [
        { id: 'a', text: 'Promise', isCorrect: true, explanation: '正解！async 関数内で return された値は自動的に Promise.resolve(value) でラップされます。' },
        { id: 'b', text: 'Observable', isCorrect: false, explanation: '誤りです。ObservableはRxJS等のライブラリの型です。' },
        { id: 'c', text: 'Callback', isCorrect: false, explanation: '誤りです。' }
      ]
    }
  }
};
