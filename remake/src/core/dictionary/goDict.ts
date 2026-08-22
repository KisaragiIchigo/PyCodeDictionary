import { DictEntry } from '../../types';

export const goDictionary: DictEntry[] = [
  {
    term: 'func',
    language: 'go',
    category: 'keyword',
    summary: '関数またはメソッドを定義します',
    detailedExplanation: 'Goの関数宣言構文。レシーバー引数を付与することで構造体に対するメソッドを定義できます。多値戻り値（(result, error)）をサポートします。',
    example: 'func (s *Server) HandleRequest(w http.ResponseWriter, r *http.Request) error {\n    // ハンドラ処理\n    return nil\n}',
    bestPractice: 'エラーが発生し得る関数は最後の戻り値として error を返し、呼び出し元で if err != nil でチェックします。'
  },
  {
    term: 'goroutine',
    language: 'go',
    category: 'syntax',
    summary: '軽量な並行実行スレッドを起動します（go キーワード）',
    detailedExplanation: 'OSスレッドよりはるかに軽量なグリーンスレッドとしてGoランタイムが管理します。数万個のgoroutineを低オーバーヘッドで起動可能です。',
    example: 'go func() {\n    time.Sleep(1 * time.Second)\n    fmt.Println("非同期タスク完了")\n}()',
    bestPractice: 'goroutineリークを防ぐため、context.Context によるキャンセル制御や sync.WaitGroup での終了同期を徹底します。'
  },
  {
    term: 'channel',
    language: 'go',
    category: 'builtin',
    summary: 'goroutine間で安全にデータを送受信するためのパイプ（通信チャネル）',
    detailedExplanation: 'make(chan T) で生成し、ch <- value で送信、value := <-ch で受信します。バッファ付きとバッファなしがあります。',
    example: 'messages := make(chan string, 10)\nmessages <- "ping"\nmsg := <-messages',
    bestPractice: 'Goの哲学「メモリ共有によって通信するな、通信によってメモリを共有せよ」を体現する機能です。'
  },
  {
    term: 'defer',
    language: 'go',
    category: 'keyword',
    summary: '関数の終了時（リターン直前）まで指定した処理の実行を遅延します',
    detailedExplanation: 'ファイルのClose()、ミューテックスのUnlock()、リカバリ処理（recover()）など、確実な後片付けを保証します。LIFO（後入れ先出し）順で実行されます。',
    example: 'f, err := os.Open("data.csv")\nif err != nil {\n    return err\n}\ndefer f.Close()',
    bestPractice: 'リソース取得直後に defer でクローズ処理を書くことで、複数のリターンパスにおけるクローズ漏れを確実に防ぎます。'
  },
  {
    term: 'interface',
    language: 'go',
    category: 'keyword',
    summary: 'メソッドの集合（振る舞い）を定義するインターフェース型',
    detailedExplanation: 'Goでは明示的な implements キーワードは不要（ダックタイピング）。インターフェースに定義された全メソッドを実装していれば暗黙に満たされます。',
    example: 'type Reader interface {\n    Read(p []byte) (n int, err error)\n}',
    bestPractice: 'インターフェースは小さく設計（1〜2メソッド）し、使う側（パッケージ利用者）で定義するのがGoのイディオムです。'
  }
];
