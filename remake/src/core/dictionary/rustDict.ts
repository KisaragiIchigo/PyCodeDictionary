import { DictEntry } from '../../types';

export const rustDictionary: DictEntry[] = [
  {
    term: 'fn',
    language: 'rust',
    category: 'keyword',
    summary: '関数またはメソッドを定義します',
    detailedExplanation: '引数と戻り値の型を明示的に指定します。最後の式（セミコロンなし）が戻り値として暗黙に評価されます。',
    example: 'fn calculate_distance(p1: &Point, p2: &Point) -> f64 {\n    let dx = p1.x - p2.x;\n    let dy = p1.y - p2.y;\n    (dx * dx + dy * dy).sqrt()\n}',
    bestPractice: '借用（&T や &mut T）を適切に選択し、不要なクローン（clone）を避けて所有権システムを活かします。'
  },
  {
    term: 'struct',
    language: 'rust',
    category: 'keyword',
    summary: '構造体（カスタムデータ型）を定義します',
    detailedExplanation: '名前付きフィールド構造体、タプル構造体、ユニット構造体があり、impl ブロックでメソッドや関連関数を付与します。',
    example: 'struct User {\n    username: String,\n    email: String,\n    sign_in_count: u64,\n    active: bool,\n}',
    bestPractice: 'デバッグ出力やシリアライズのために #[derive(Debug, Clone, Serialize, Deserialize)] などの derive アトリビュートを活用します。'
  },
  {
    term: 'impl',
    language: 'rust',
    category: 'keyword',
    summary: '型に対するメソッドや関連関数、またはトレイトの実装を定義します',
    detailedExplanation: 'impl Type で固有メソッドを、impl Trait for Type でトレイトを実装します。',
    example: 'impl User {\n    fn new(username: String, email: String) -> Self {\n        Self { username, email, sign_in_count: 1, active: true }\n    }\n}',
    bestPractice: '関連する処理は impl ブロックにまとめ、カプセル化（pub / 非pubの使い分け）を徹底します。'
  },
  {
    term: 'match',
    language: 'rust',
    category: 'keyword',
    summary: '強力なパターンマッチングを行い、式を評価します',
    detailedExplanation: 'すべての可能なパターンを網羅（exhaustive）する必要があり、Option や Result、enum のバリアント分解に必須です。',
    example: 'match result {\n    Ok(value) => println!("Success: {}", value),\n    Err(e) => eprintln!("Error occurred: {}", e),\n}',
    bestPractice: '網羅性チェックにより未処理ケースのバグをコンパイル時に防止できます。'
  },
  {
    term: 'Option',
    language: 'rust',
    category: 'type',
    summary: '値が存在するか（Some(T)）、存在しないか（None）を表す型',
    detailedExplanation: 'Rustには null が存在せず、値の不在は Option<T> で明示的に表現します。',
    example: 'fn find_user(id: u64) -> Option<User> {\n    // 見つかれば Some(user)、なければ None\n}',
    bestPractice: 'unwrap() の多用はパニックの原因となるため、match, if let, unwrap_or, または ? 演算子で安全に処理します。'
  },
  {
    term: 'Result',
    language: 'rust',
    category: 'type',
    summary: '成功時の値（Ok(T)）またはエラー（Err(E)）を表す結果型',
    detailedExplanation: 'Rustにおける例外機構の代替であり、回復可能なエラーを型安全に扱います。? 演算子で呼び出し元にエラーを伝播できます。',
    example: 'fn read_file(path: &str) -> Result<String, io::Error> {\n    let mut file = File::open(path)?;\n    let mut contents = String::new();\n    file.read_to_string(&mut contents)?;\n    Ok(contents)\n}',
    bestPractice: 'エラー型には thiserror や anyhow クレートを併用してエラーコンテキストを明確にします。'
  }
];
