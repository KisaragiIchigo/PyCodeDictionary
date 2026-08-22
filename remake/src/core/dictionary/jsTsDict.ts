import { DictEntry } from '../../types';

export const jsTsDictionary: DictEntry[] = [
  {
    term: 'const',
    language: 'typescript',
    category: 'keyword',
    summary: '再代入不可能なブロックブロックスコープの定数を宣言します',
    detailedExplanation: 'ES2015で導入された宣言キーワード。変数の再代入を防ぎますが、オブジェクトや配列の内部プロパティの変更（ミューテーション）は許可されます。',
    example: 'const API_BASE_URL = "https://api.example.com";\nconst config = { timeout: 5000 };\nconfig.timeout = 3000; // 有効（プロパティ変更）',
    bestPractice: '変数は原則として const で宣言し、再代入が不可欠な場合のみ let を使います。var は使用しません。'
  },
  {
    term: 'let',
    language: 'typescript',
    category: 'keyword',
    summary: '再代入可能なブロックスコープの変数を宣言します',
    detailedExplanation: 'if 文や for ループのブロック {} 内でのみ有効なスコープを持ち、巻き上げ（Hoisting）による未定義参照バグを防ぎます。',
    example: 'let count = 0;\nfor (let i = 0; i < 10; i++) {\n  count += i;\n}',
    bestPractice: 'スコープをできる限り狭く保ち、不要な場所での再代入を避けます。'
  },
  {
    term: 'interface',
    language: 'typescript',
    category: 'type',
    summary: 'オブジェクトの構造や契約（型）を定義します',
    detailedExplanation: 'TypeScriptにおいて、オブジェクトのプロパティ、メソッド、引数型、戻り値型を定義します。extends による拡張や宣言マージ（Declaration Merging）が可能です。',
    example: 'interface UserProfile {\n  id: string;\n  name: string;\n  email?: string; // オプショナル\n  readonly createdAt: Date;\n}',
    bestPractice: 'オブジェクトの形状やOOP的クラス実装の契約には interface、ユニオン型やタプル・計算型には type エイリアスを使い分けるのが一般的です。'
  },
  {
    term: 'type',
    language: 'typescript',
    category: 'type',
    summary: '型のエイリアス（別名）やユニオン型・交差型を定義します',
    detailedExplanation: 'プリミティブ型、ユニオン型（A | B）、交差型（A & B）、タプル型、ユーティリティ型（Partial<T>, Record<K, V>）など柔軟な型定義が可能です。',
    example: 'type Status = "pending" | "fulfilled" | "rejected";\ntype Nullable<T> = T | null;',
    bestPractice: '直和型（Discriminated Union）を定義して網羅性チェック（exhaustive check）と組み合わせることで堅牢なコードが書けます。'
  },
  {
    term: 'async',
    language: 'typescript',
    category: 'keyword',
    summary: 'Promiseを返す非同期関数を宣言します',
    detailedExplanation: '関数内で await キーワードを使用可能にし、非同期処理を同期処理のようなフラットな構文で記述できます。戻り値は自動的に Promise<T> でラップされます。',
    example: 'async function fetchPosts(): Promise<Post[]> {\n  const response = await fetch("/api/posts");\n  return response.json();\n}',
    bestPractice: 'エラーハンドリングには try...catch を適切に配置するか、Promise.allSettled を併用して並行処理のエラー耐性を高めます。'
  },
  {
    term: 'await',
    language: 'typescript',
    category: 'keyword',
    summary: 'Promiseの解決（resolve）または拒絶（reject）を非同期に待機します',
    detailedExplanation: 'Promiseが解決するまで後続コードの実行を一時停止し、解決された値をアンラップして返します。',
    example: 'const data = await apiClient.getUser(userId);',
    bestPractice: '複数の独立したPromiseを直列に await するとボトルネックになるため、Promise.all([p1, p2]) で並列化します。'
  },
  {
    term: 'useMemo',
    language: 'typescript',
    category: 'framework',
    summary: '高コストな計算結果を依存配列の値が変わるまでキャッシュ（メモ化）するReactフック',
    detailedExplanation: 'コンポーネントの再レンダリング時に、依存配列（dependencies）が変わらない限り前回の計算結果を再利用します。',
    example: 'const filteredList = useMemo(() => {\n  return items.filter(item => item.score > threshold);\n}, [items, threshold]);',
    bestPractice: '安易な全件 useMemo はオーバーヘッドになるため、重い計算や参照同一性が下流コンポーネントの再レンダリング防止に必要な場合に限定します。'
  },
  {
    term: 'useCallback',
    language: 'typescript',
    category: 'framework',
    summary: '関数のインスタンスを依存配列が変わるまで再生成せずメモ化するReactフック',
    detailedExplanation: 'React.memo化された子コンポーネントにコールバック関数を props として渡す際、不要な再レンダリングを抑止するために使います。',
    example: 'const handleClick = useCallback((id: string) => {\n  setSelectedId(id);\n}, []);',
    bestPractice: '子コンポーネントが memo 化されていない場合は useCallback の恩恵が薄いため、計測と目的に応じて適用します。'
  },
  {
    term: 'Promise',
    language: 'javascript',
    category: 'builtin',
    summary: '非同期処理の最終的な完了（または失敗）とその結果の値を表すオブジェクト',
    detailedExplanation: 'Pending（保留）、Fulfilled（成功）、Rejected（拒絶）の3つの状態を持ち、.then(), .catch(), .finally() メソッドをチェーンできます。',
    example: 'Promise.all([fetchUsers(), fetchSettings()])\n  .then(([users, settings]) => console.log(users, settings))\n  .catch(err => console.error(err));',
    bestPractice: '未処理のPromise拒絶（UnhandledPromiseRejection）を防ぐため、必ず catch または try-catch でハンドリングします。'
  }
];
