import { InteractiveExplanation } from '../../../types';

export const pythonInteractiveMap: Record<string, InteractiveExplanation> = {
  def: {
    anatomy: {
      title: 'Python 関数定義の構文解剖',
      description: '関数名、引数リスト、デフォルト値、型ヒント、戻り値の型アノテーションの各要素に触れて学べます。',
      codeTemplate: 'def calculate_total(price: float, tax_rate: float = 0.1) -> float:',
      tokens: [
        { text: 'def', role: '関数定義キーワード', explanation: '新しい関数やメソッドの定義を開始する予約語です。', type: 'keyword' },
        { text: 'calculate_total', role: '関数名 (Identifier)', explanation: '関数の識別子です。PythonではPEP8に従いsnake_caseで命名します。', type: 'identifier' },
        { text: '(', role: '引数開始', explanation: '引数リストの開始括弧です。', type: 'punctuation' },
        { text: 'price: float', role: '位置引数 & 型注釈', explanation: '必須引数priceと、float型を期待する型ヒントです。', type: 'param' },
        { text: ', ', role: '区切り記号', explanation: '複数の引数を区切るカンマです。', type: 'punctuation' },
        { text: 'tax_rate: float = 0.1', role: 'デフォルト引数', explanation: '呼び出し時に省略可能なキーワード引数です。省略時は0.1が使われます。', type: 'param' },
        { text: ')', role: '引数終了', explanation: '引数リストの終了括弧です。', type: 'punctuation' },
        { text: ' -> float', role: '戻り値の型ヒント', explanation: 'この関数が呼び出し元にfloat型の値を返すことを明示します。', type: 'return' },
        { text: ':', role: 'ブロック開始コロン', explanation: '関数本体のインデントブロックを開始する必須コロンです。', type: 'punctuation' }
      ]
    },
    playgroundDefaultCode: `def calculate_total(price: float, tax_rate: float = 0.1) -> float:
    """税込み金額を計算して返します"""
    tax = price * tax_rate
    return round(price + tax, 2)

# 関数の実行と出力
total_1 = calculate_total(1000)
total_2 = calculate_total(1500, tax_rate=0.08)

print(f"標準税率(10%): {total_1} 円")
print(f"軽減税率(8%): {total_2} 円")`,
    conceptSim: {
      type: 'generic_flow',
      title: '関数のコールスタック & 引数バインディング',
      description: '関数呼び出し時の引数の受け渡しとローカルスコープの生成プロセスを図解します。',
      defaultMode: 'keyword_args',
      modes: [
        { id: 'pos_args', label: '位置引数', description: '呼び出し順にパラメータへ値が渡されます。' },
        { id: 'keyword_args', label: 'キーワード引数', description: '引数名を指定して順不同で渡せます。' },
        { id: 'default_args', label: 'デフォルト値適用', description: '省略された引数に初期値が自動バインドされます。' }
      ]
    },
    quiz: {
      question: 'Pythonの関数引数において、デフォルト値を持つ引数の定義ルールとして正しいものはどれ？',
      options: [
        { id: 'a', text: 'デフォルト値を持つ引数は、デフォルト値のない引数より後に書かなければならない', isCorrect: true, explanation: '正解！非デフォルト引数の前にデフォルト引数を置くと SyntaxError: non-default argument follows default argument になります。' },
        { id: 'b', text: 'デフォルト値を持つ引数は、必ず引数リストの先頭に書かなければならない', isCorrect: false, explanation: '誤りです。先頭に置くと構文エラーになります。' },
        { id: 'c', text: 'デフォルト値には可変オブジェクト（listやdict）を指定するのがベストプラクティスである', isCorrect: false, explanation: '誤りです。可変オブジェクトをデフォルト値にすると全呼び出しで共有されてバグの原因になるため、Noneを使って関数内で初期化します。' }
      ]
    }
  },

  async: {
    anatomy: {
      title: '非同期関数 (Coroutines) の構文解剖',
      description: 'async def による非同期コルーチン定義とノンブロッキングI/Oの構文です。',
      codeTemplate: 'async def fetch_user_data(user_id: int) -> dict:',
      tokens: [
        { text: 'async', role: '非同期修飾キーワード', explanation: '後続のdef関数をコルーチン関数として宣言します。', type: 'keyword' },
        { text: 'def', role: '関数定義', explanation: '関数定義キーワードです。', type: 'keyword' },
        { text: 'fetch_user_data', role: '関数名', explanation: '非同期関数の識別子です。', type: 'identifier' },
        { text: '(user_id: int)', role: '引数', explanation: '検索対象のユーザーIDです。', type: 'param' },
        { text: ' -> dict:', role: '戻り値 & コロン', explanation: '辞書オブジェクトを返すことを示します。', type: 'return' }
      ]
    },
    playgroundDefaultCode: `import asyncio

async def fetch_api(endpoint: str, delay: float):
    print(f"[{endpoint}] リクエスト送信開始...")
    await asyncio.sleep(delay)  # I/O待ちを模倣
    print(f"[{endpoint}] レスポンス受信完了!")
    return {"endpoint": endpoint, "status": 200}

# 複数APIの並行呼び出しシミュレーション
print("並行リクエスト開始")
# asyncio.gather(fetch_api("users", 0.5), fetch_api("posts", 0.3))`,
    conceptSim: {
      type: 'async_timeline',
      title: '直列実行 (Serial) vs 並行実行 (Parallel asyncio.gather)',
      description: 'ノンブロッキングI/Oによって、待ち時間中に他のタスクへCPUを譲る仕組みをタイムラインで比較します。',
      defaultMode: 'parallel',
      modes: [
        { id: 'serial', label: '直列実行 (await順次)', description: '各I/Oの完了を1つずつ待つため、合計時間が加算されます（1.0s + 0.8s = 1.8s）。' },
        { id: 'parallel', label: '並行実行 (asyncio.gather)', description: 'I/O待ちの間に並行して処理が進むため、最長のリクエスト時間（1.0s）で完了します！' }
      ]
    },
    quiz: {
      question: 'async def で定義されたコルーチン関数を呼び出すとき、処理を正しく待機して結果を得る構文は？',
      options: [
        { id: 'a', text: 'result = await my_coroutine()', isCorrect: true, explanation: '正解！awaitキーワードを付与することで、コルーチンの完了をイベントループを止めずに待機します。' },
        { id: 'b', text: 'result = my_coroutine.run()', isCorrect: false, explanation: '誤りです。コルーチンオブジェクトには .run() メソッドはありません。' },
        { id: 'c', text: 'result = sync(my_coroutine())', isCorrect: false, explanation: '誤りです。Pythonにsyncという標準関数はありません。' }
      ]
    }
  },

  with: {
    anatomy: {
      title: 'コンテキストマネージャ (with文) の構文解剖',
      description: 'リソースの安全なオープンと、終了時の確実な自動クローズを保証する構文です。',
      codeTemplate: 'with open("data.json", "r", encoding="utf-8") as f:',
      tokens: [
        { text: 'with', role: 'コンテキスト管理キーワード', explanation: '__enter__ と __exit__ を自動実行するブロックを開始します。', type: 'keyword' },
        { text: 'open(...)', role: 'コンテキストマネージャ式', explanation: '__enter__と__exit__を実装したファイルオブジェクトを生成します。', type: 'identifier' },
        { text: 'as', role: 'エイリアスバインド', explanation: '__enter__()の戻り値を変数に代入します。', type: 'keyword' },
        { text: 'f', role: 'バインド変数名', explanation: 'ブロック内で使用するファイルハンドル変数です。', type: 'param' },
        { text: ':', role: 'ブロック開始コロン', explanation: 'インデントブロックの開始を示します。', type: 'punctuation' }
      ]
    },
    playgroundDefaultCode: `class MockDatabaseSession:
    def __init__(self, db_name: str):
        self.db_name = db_name
    
    def __enter__(self):
        print(f"[DB: {self.db_name}] コネクション確立 (__enter__)")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            print(f"[DB] エラー発生のためロールバック: {exc_val}")
        else:
            print(f"[DB] コミット成功 & 切断完了 (__exit__)")
        return True

# with文の実行
print("--- 正常系 ---")
with MockDatabaseSession("ProductionDB") as db:
    print("データ書き込み処理中...")`,
    conceptSim: {
      type: 'with_lifecycle',
      title: 'コンテキストマネージャのライフサイクル遷移',
      description: '例外の発生有無に関わらず __exit__ が確実に呼び出されリソースが保護される流れを図解します。',
      defaultMode: 'success',
      modes: [
        { id: 'success', label: '正常終了時', description: '__enter__ -> ユーザー処理 -> __exit__(exc=None) -> 安全解放' },
        { id: 'exception', label: '例外発生時', description: '__enter__ -> 処理でエラー発生 -> __exit__(exc)でクリーンアップ -> ロールバック' }
      ]
    },
    quiz: {
      question: '自作クラスを with 文（コンテキストマネージャ）に対応させるために実装が必要な特殊メソッドのペアは？',
      options: [
        { id: 'a', text: '__enter__ と __exit__', isCorrect: true, explanation: '正解！__enter__でリソース確保、__exit__でクリーンアップを実装します。' },
        { id: 'b', text: '__start__ と __stop__', isCorrect: false, explanation: '誤りです。Pythonのコンテキストマネージャプロトコルは __enter__ と __exit__ です。' },
        { id: 'c', text: '__open__ と __close__', isCorrect: false, explanation: '誤りです。close()を直接呼ぶのではなく、__exit__が使われます。' }
      ]
    }
  },

  class: {
    anatomy: {
      title: 'クラス定義 & 継承の構文解剖',
      description: 'オブジェクト指向の基本単位であるクラス定義と基底クラス継承の構文です。',
      codeTemplate: 'class AdvancedAnalyzer(BaseEngine, DiagnosticMixin):',
      tokens: [
        { text: 'class', role: 'クラス定義キーワード', explanation: '新しいクラス（型）を定義する予約語です。', type: 'keyword' },
        { text: 'AdvancedAnalyzer', role: 'クラス名 (PascalCase)', explanation: 'クラスの識別子です。PEP8ではPascalCase（キャメルケース）を使います。', type: 'identifier' },
        { text: '(', role: '継承開始', explanation: '継承する親クラスのリストを開始します。', type: 'punctuation' },
        { text: 'BaseEngine', role: '第1親クラス', explanation: '基本機能を継承する主要スーパークラスです。', type: 'type' },
        { text: ', ', role: '区切り記号', explanation: '多重継承の親クラスを区切ります。', type: 'punctuation' },
        { text: 'DiagnosticMixin', role: 'Mixinクラス', explanation: '診断機能を注入するためのMixinクラスです。', type: 'type' },
        { text: ')', role: '継承終了', explanation: '継承リストの終了括弧です。', type: 'punctuation' },
        { text: ':', role: 'ブロック開始コロン', explanation: 'クラス本体の定義を開始します。', type: 'punctuation' }
      ]
    },
    playgroundDefaultCode: `class CodeAnalyzer:
    def __init__(self, language: str):
        self.language = language
        self.scanned_count = 0
    
    def analyze(self, filename: str) -> str:
        self.scanned_count += 1
        return f"[{self.language}] {filename} を解析しました (合計: {self.scanned_count}件)"

# クラスのインスタンス化とメソッド呼び出し
analyzer = CodeAnalyzer("Python")
print(analyzer.analyze("main.py"))
print(analyzer.analyze("utils.py"))`,
    conceptSim: {
      type: 'generic_flow',
      title: 'インスタンス生成と __init__ の初期化プロセス',
      description: 'クラスからインスタンスオブジェクトが生成され、属性（self.xxx）が初期化される流れです。',
      defaultMode: 'instance_creation',
      modes: [
        { id: 'instance_creation', label: 'インスタンス化', description: 'メモリ領域確保 -> __init__(self) で初期化 -> 参照を返す' },
        { id: 'method_call', label: 'メソッド呼び出し', description: '第1引数 self にインスタンス自身が自動で渡されます' }
      ]
    },
    quiz: {
      question: 'Pythonのクラス内メソッドで、インスタンス自身を指す第1引数の標準的な命名は？',
      options: [
        { id: 'a', text: 'self', isCorrect: true, explanation: '正解！Pythonの規約として、インスタンスメソッドの第1引数には必ず self を指定します。' },
        { id: 'b', text: 'this', isCorrect: false, explanation: '誤りです。thisはC++/Java/JavaScriptなどのキーワードです。' },
        { id: 'c', text: 'cls', isCorrect: false, explanation: '誤りです。clsはクラスメソッド（@classmethod）の第1引数として使われます。' }
      ]
    }
  },

  yield: {
    anatomy: {
      title: 'ジェネレータ (yield式) の構文解剖',
      description: 'メモリを節約しながら逐次ストリーム処理を行うジェネレータ関数の構文です。',
      codeTemplate: 'yield current_item',
      tokens: [
        { text: 'yield', role: 'ジェネレータ生成キーワード', explanation: '呼び出し元に値を1つ返し、関数のローカル変数や実行位置を一時停止（サスペンド）します。', type: 'keyword' },
        { text: 'current_item', role: '返却値式', explanation: 'イテレーションの次の要素として生成・返却される値です。', type: 'identifier' }
      ]
    },
    playgroundDefaultCode: `def countdown(start: int):
    print(f"--- カウントダウン開始: {start} ---")
    current = start
    while current > 0:
        yield current  # ここで一時停止して値を返す
        current -= 1
    print("--- 完了 ---")

# ジェネレータの逐次取得
gen = countdown(3)
for val in gen:
    print(f"カウント: {val}")`,
    conceptSim: {
      type: 'generator_stream',
      title: 'ジェネレータのサスペンド & レジューム',
      description: '全データを一括でリストに載せず、next()が呼ばれるたびに1つずつ生成する省メモリの仕組みです。',
      defaultMode: 'streaming',
      modes: [
        { id: 'streaming', label: 'ストリーム生成', description: 'yield で一時停止 -> next() で再開 -> 終了時に StopIteration' },
        { id: 'memory_compare', label: 'メモリ消費比較', description: 'List(100万件)=約8MB vs Generator=約120バイト（圧倒的軽量）' }
      ]
    },
    quiz: {
      question: 'yield を含む関数を呼び出した直後に返されるオブジェクトは？',
      options: [
        { id: 'a', text: 'ジェネレータオブジェクト (Generator)', isCorrect: true, explanation: '正解！関数本体はすぐには実行されず、イテレーション可能なGeneratorオブジェクトが返されます。' },
        { id: 'b', text: '最初の yield で指定された値', isCorrect: false, explanation: '誤りです。値を取り出すには next() または for ループを回す必要があります。' },
        { id: 'c', text: 'すべての値を格納したリスト (list)', isCorrect: false, explanation: '誤りです。一括リスト化はされず、必要な時に1つずつ生成されます。' }
      ]
    }
  }
};
