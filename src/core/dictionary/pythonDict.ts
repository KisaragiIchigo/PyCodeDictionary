import { DictEntry } from '../../types';

export const pythonDictionary: DictEntry[] = [
  // キーワード
  {
    term: 'def',
    language: 'python',
    category: 'keyword',
    summary: '関数またはメソッドを定義します',
    detailedExplanation: 'Pythonにおける関数定義の基本キーワードです。引数、デフォルト値、型ヒント（Type Hints）、可変長引数（*args, **kwargs）を指定できます。',
    example: 'def calculate_total(price: float, tax_rate: float = 0.1) -> float:\n    return price * (1.0 + tax_rate)',
    bestPractice: '関数名はsnake_caseを用い、処理の意図が明確に伝わる命名を心がけます。可能な限り型ヒントとdocstringを付与しましょう。'
  },
  {
    term: 'class',
    language: 'python',
    category: 'keyword',
    summary: 'クラスを定義してオブジェクト指向プログラミングを実現します',
    detailedExplanation: '属性（フィールド）やメソッドを持つデータ構造の雛形を定義します。多重継承、メタクラス、特殊メソッド（__init__, __str__ 等）をサポートします。',
    example: 'class DataProcessor:\n    def __init__(self, name: str):\n        self.name = name\n    \n    def process(self, data: list) -> list:\n        return [x * 2 for x in data]',
    bestPractice: 'クラス名はPascalCaseを使用します。データ保持が主目的ならdataclass（@dataclass）やNamedTupleの利用を検討してください。'
  },
  {
    term: 'async',
    language: 'python',
    category: 'keyword',
    summary: '非同期関数（コルーチン）を定義します',
    detailedExplanation: 'async def で定義された関数はコルーチンとなり、await 式を使ってイベントループをブロックせずにI/Oや並行処理を実行できます。',
    example: 'async def fetch_user_data(user_id: int) -> dict:\n    async with httpx.AsyncClient() as client:\n        res = await client.get(f"https://api.example.com/users/{user_id}")\n        return res.json()',
    bestPractice: 'I/O待ち（API通信やファイル読み書き）が多い処理で活用し、CPUヘビーな計算にはconcurrent.futuresやmultiprocessingを使用します。'
  },
  {
    term: 'await',
    language: 'python',
    category: 'keyword',
    summary: '非同期処理の完了を待機し、結果を取り出します',
    detailedExplanation: 'async def の関数内でのみ使用可能で、Awaitableオブジェクト（Task, Future, コルーチン）の終了をノンブロッキングで待機します。',
    example: 'result = await async_task()',
    bestPractice: 'ループ内で直列にawaitすると遅くなるため、並列実行可能な場合は asyncio.gather() や asyncio.TaskGroup を活用します。'
  },
  {
    term: 'with',
    language: 'python',
    category: 'keyword',
    summary: 'コンテキストマネージャを用いてリソースの自動管理（クリーンアップ）を行います',
    detailedExplanation: '__enter__ と __exit__ メソッドを呼び出すことで、ファイルのクローズ、ロックの解放、DB接続の返却などを例外発生時でも確実に実行します。',
    example: 'with open("config.json", "r", encoding="utf-8") as f:\n    data = json.load(f)',
    bestPractice: 'ファイルやネットワーク、DBセッション、スレッドロックなどを扱う際は必ず with 文を使用し、リソースリークを防ぎます。'
  },
  {
    term: 'yield',
    language: 'python',
    category: 'keyword',
    summary: 'ジェネレータ関数から値を1つ返し、関数の状態を一時停止します',
    detailedExplanation: '関数のローカル変数や実行状態を保持したまま呼び出し元に値を返します。メモリを節約しながらストリーム処理や巨大データの逐次処理が可能です。',
    example: 'def fibonacci_generator(n: int):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b',
    bestPractice: '全件をリストに格納するとメモリが枯渇するような大規模データ・ログ走査にはジェネレータを積極的に使います。'
  },
  {
    term: 'lambda',
    language: 'python',
    category: 'keyword',
    summary: '単一の式からなる無名関数（即時関数）を作成します',
    detailedExplanation: '簡易的な関数オブジェクトをインラインで定義します。複数文や代入文は記述できません。',
    example: 'sorted_users = sorted(users, key=lambda u: u["age"], reverse=True)',
    bestPractice: '複雑な処理や複数行に及ぶロジックを無理にlambdaで書かず、通常の def 関数として定義する方が可読性が保たれます。'
  },
  {
    term: 'try',
    language: 'python',
    category: 'keyword',
    summary: '例外が発生する可能性のある処理ブロックを開始します',
    detailedExplanation: 'except, else, finally ブロックと組み合わせて例外の捕捉・フォールバック・確実な終了処理を構築します。',
    example: 'try:\n    value = int(raw_input)\nexcept ValueError as e:\n    print(f"無効な数値です: {e}")\nelse:\n    print(f"正常変換: {value}")\nfinally:\n    cleanup()',
    bestPractice: 'ベタな except Exception: や except: は避け、捕捉したい具体的な例外クラス（ValueError, KeyError等）を明示します。'
  },
  {
    term: 'import',
    language: 'python',
    category: 'keyword',
    summary: '外部モジュールやパッケージを現在の名前空間に読み込みます',
    detailedExplanation: 'import module または from module import member の形式で標準ライブラリやサードパーティパッケージを取り込みます。',
    example: 'import os\nfrom pathlib import Path\nfrom typing import Optional, List',
    bestPractice: 'PEP8に従い、標準ライブラリ → サードパーティ → ローカルモジュールの順に空行で区切ってグループ化します。'
  },
  {
    term: 'global',
    language: 'python',
    category: 'keyword',
    summary: '関数内からモジュールレベルのグローバル変数を再バインド（代入）します',
    detailedExplanation: '読み取りだけであれば不要ですが、関数内でグローバル変数に新しい値を代入する際に必要です。',
    example: 'counter = 0\ndef increment():\n    global counter\n    counter += 1',
    bestPractice: 'グローバル変数の乱用は副作用とデバッグ困難の原因となるため、クラスの状態（属性）や関数の引数・戻り値で管理することを強く推奨します。'
  },
  {
    term: 'nonlocal',
    language: 'python',
    category: 'keyword',
    summary: '外側のエンクロージング（囲む関数）スコープの変数を再バインドします',
    detailedExplanation: 'クロージャや入れ子になった関数において、親関数のローカル変数に代入を行う際に宣言します。',
    example: 'def make_counter():\n    count = 0\n    def counter():\n        nonlocal count\n        count += 1\n        return count\n    return counter',
    bestPractice: '状態を持つ高階関数を作る際に有効ですが、複雑化する場合はクラスへのリファクタリングを検討します。'
  },

  // ビルトイン関数
  {
    term: 'len',
    language: 'python',
    category: 'builtin',
    summary: 'オブジェクトの要素数（長さ）を返します',
    detailedExplanation: '文字列、リスト、タプル、辞書、セットなどのコレクションや、__len__ メソッドを実装したオブジェクトの長さを O(1) で取得します。',
    example: 'count = len([1, 2, 3, 4, 5])  # 5',
    bestPractice: 'コレクションが空かどうかの判定には if len(items) == 0: ではなく、Pythonの真理値判定 if not items: を使うのがPythonicです。'
  },
  {
    term: 'print',
    language: 'python',
    category: 'builtin',
    summary: '指定したオブジェクトを文字列化して標準出力（またはファイル）に出力します',
    detailedExplanation: 'sep（区切り文字）、end（末尾文字）、file（出力先ストリーム）、flush（バッファ即時フラッシュ）のキーワード引数を持ちます。',
    example: 'print("Status:", "OK", sep=" ", end="\\n", flush=True)',
    bestPractice: '本番コードやライブラリでは print でのデバッグ出力を残さず、logging モジュール（logging.getLogger）を使って適切なログレベルで出力します。'
  },
  {
    term: 'range',
    language: 'python',
    category: 'builtin',
    summary: '等差数列を生成するイテラブル（不変シーケンス）を作成します',
    detailedExplanation: 'range(stop), range(start, stop), range(start, stop, step) の形式で指定します。メモリ上にすべての数値を展開せず、必要時にオンデマンドで生成します。',
    example: 'for i in range(0, 10, 2):\n    print(i)  # 0, 2, 4, 6, 8',
    bestPractice: 'インデックスと要素の両方が必要なループでは、range(len(items)) ではなく enumerate(items) を使いましょう。'
  },
  {
    term: 'enumerate',
    language: 'python',
    category: 'builtin',
    summary: 'イテラブルの要素とインデックス番号をタプル (index, item) として返すイテレータを生成します',
    detailedExplanation: 'start 引数で開始インデックスを指定できます（デフォルトは0）。ループ内で手動でカウンタ変数をインクリメントする必要がなくなります。',
    example: 'for idx, name in enumerate(["Alice", "Bob", "Charlie"], start=1):\n    print(f"{idx}: {name}")',
    bestPractice: 'インデックスが必要なループ処理の第一選択です。'
  },
  {
    term: 'zip',
    language: 'python',
    category: 'builtin',
    summary: '複数のイテラブルから要素を1つずつ取り出し、タプルにして束ねるイテレータを返します',
    detailedExplanation: '一番短いイテラブルが終了した時点で止まります。Python 3.10以降では strict=True を指定して要素数が一致しない場合に ValueError を送出できます。',
    example: 'names = ["A", "B", "C"]\nscores = [90, 85, 95]\nfor name, score in zip(names, scores, strict=True):\n    print(f"{name}: {score}")',
    bestPractice: '長さが異なる場合の不整合バグを防ぐため、要素数が同じ想定の時は strict=True を明示することが推奨されます。'
  },
  {
    term: 'map',
    language: 'python',
    category: 'builtin',
    summary: '指定した関数をイテラブルの全要素に適用するイテレータを返します',
    detailedExplanation: '遅延評価されるため、大容量データに対して効率的です。',
    example: 'numbers = ["1", "2", "3"]\nints = list(map(int, numbers))',
    bestPractice: '単純な変換であればリスト内包表記 [int(x) for x in numbers] の方が直感的でPythonicと見なされることが多いです。'
  },
  {
    term: 'filter',
    language: 'python',
    category: 'builtin',
    summary: '条件関数（述語）が真を返す要素のみを抽出するイテレータを返します',
    detailedExplanation: '第1引数に関数（または None）、第2引数にイテラブルを渡します。',
    example: 'evens = list(filter(lambda x: x % 2 == 0, range(10)))',
    bestPractice: '内包表記 [x for x in range(10) if x % 2 == 0] の方が可読性が高い場合が多いです。'
  },
  {
    term: 'isinstance',
    language: 'python',
    category: 'builtin',
    summary: 'オブジェクトが指定した型（または型のタプル）のインスタンスかどうかを判定します',
    detailedExplanation: '継承関係（サブクラス）も考慮して True を返します。type(obj) == Cls と比較するよりも安全で拡張性があります。',
    example: 'if isinstance(data, (list, tuple)):\n    print(f"コレクション要素数: {len(data)}")',
    bestPractice: '厳密な型比較ではなく isinstance を使い、ポリモーフィズムや基底クラスの柔軟性を活かします。'
  },
  {
    term: 'open',
    language: 'python',
    category: 'builtin',
    summary: 'ファイルを開き、ファイルオブジェクト（ストリーム）を返します',
    detailedExplanation: 'mode（"r", "w", "a", "rb", "wb" 等）や encoding（"utf-8" 等）を指定します。',
    example: 'with open("data.txt", "w", encoding="utf-8") as f:\n    f.write("Hello World")',
    bestPractice: 'テキストファイルを扱う際は必ず encoding="utf-8" を明示し、OSデフォルト文字コードによる文字化けを防ぎます。pathlib.Path のメソッド（Path.read_text）も便利です。'
  },
  {
    term: 'dataclass',
    language: 'python',
    category: 'standard_lib',
    summary: 'クラスに __init__, __repr__, __eq__ などの特殊メソッドを自動生成するデコレータ',
    detailedExplanation: 'dataclasses モジュールが提供する標準機能で、ボイラープレートコードを大幅に削減し、型安全なデータ構造を定義できます。',
    example: 'from dataclasses import dataclass\n\n@dataclass\nclass UserProfile:\n    id: int\n    username: str\n    is_active: bool = True',
    bestPractice: '不変（イミュータブル）にしたい場合は @dataclass(frozen=True) を指定します。'
  }
];
