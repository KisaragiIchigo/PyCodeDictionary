import { DictEntry } from '../../types';

export const astNodeDictionary: DictEntry[] = [
  {
    term: 'FunctionDeclaration / FunctionDef',
    language: 'all',
    category: 'ast_node',
    summary: '名前付き関数の定義を表すAST構文ノード',
    detailedExplanation: '関数の識別子名（name）、仮引数リスト（params）、戻り値型（returnType）、および関数本体（body）の構文ブロックを子ノードとして保持します。',
    example: 'def calculate(x: int) -> int:\n    return x * 2'
  },
  {
    term: 'AsyncFunctionDef / AsyncFunction',
    language: 'all',
    category: 'ast_node',
    summary: '非同期コルーチン関数を表すAST構文ノード',
    detailedExplanation: 'async キーワードが付与された関数宣言。await 式を内部で使用可能であり、イベントループでの並行処理の単位となります。',
    example: 'async def fetch_user(id: str) -> dict:\n    return await client.get(id)'
  },
  {
    term: 'CallExpression / Call',
    language: 'all',
    category: 'ast_node',
    summary: '関数またはメソッドの呼び出し式を表すAST構文ノード',
    detailedExplanation: '呼び出し対象（callee：IdentifierまたはMemberExpression）と、渡された実引数リスト（arguments）で構成されます。コールグラフ構築の起点となります。',
    example: 'result = process_data(item, verbose=True)'
  },
  {
    term: 'ClassDeclaration / ClassDef',
    language: 'all',
    category: 'ast_node',
    summary: 'クラス定義を表すAST構文ノード',
    detailedExplanation: 'クラス名、継承元の基底クラス（bases/extends）、およびクラスブロック内に定義されたメソッドやフィールドを子ノードとして包含します。',
    example: 'class PaymentService(BaseService):\n    pass'
  },
  {
    term: 'VariableDeclaration / Assign',
    language: 'all',
    category: 'ast_node',
    summary: '変数宣言または代入文を表すAST構文ノード',
    detailedExplanation: '左辺のターゲット（target / pattern）と右辺の初期値式（init / value）、型注釈を保持します。定数（const）や再代入可能変数（let/var）の区別も行われます。',
    example: 'const score: number = 100;'
  },
  {
    term: 'IfStatement / If',
    language: 'all',
    category: 'ast_node',
    summary: '条件分岐を表すAST構文ノード',
    detailedExplanation: '判定条件式（test / condition）、真のときの実行ブロック（consequent）、および else 節（alternate）を保持し、循環的複雑度（Cyclomatic Complexity）の計算基準となります。',
    example: 'if count > 0:\n    return True\nelse:\n    return False'
  },
  {
    term: 'ReturnStatement / Return',
    language: 'all',
    category: 'ast_node',
    summary: '関数からの脱出と戻り値の返却を表すAST構文ノード',
    detailedExplanation: '返却する式（argument / value）を保持します。副作用のない計算層（Pure Function）の判定に不可欠なノードです。',
    example: 'return {"status": "ok", "value": result};'
  }
];
