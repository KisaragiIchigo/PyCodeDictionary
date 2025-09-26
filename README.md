# PyCodeDictionary ©️2025 KisaragiIchigo

## Download
[https://github.com/KisaragiIchigo/PyCodeDictionary/releases/tag/v0.1.0](https://graphviz.org](https://github.com/KisaragiIchigo/PyCodeDictionary/releases/tag/v0.1.0) 


## ツール概要

Pythonファイルを読み込んで、**ASTベース**で関数/クラス/メソッドの定義と呼び出し関係を解析し、
**Graphviz**で**フローチャート（PNG/SVG）**を生成・表示するツールです。エディタは**行番号ガター**付き、
**検索ハイライト**に対応。ツリーやフローチャート上のノードを**ダブルクリック/クリック**すると、
対応する**コード行へジャンプ**できます。ウィンドウは**フレームレス＆背景透過**で、端の**8pxリサイズ**や
ドラッグ移動も可能。最大化時は自動で**軽量化モード**になります。

---

## **オプション機能**:

* **実行パターン検出（タグ）**: `async` / `generator` / `io`（`with open`含む）/ `net`（`requests` / `httpx`のセッション経由含む）/ `recursive`
* **フローチャート拡張**:

  * **エッジ太さ = 呼び出し回数**
  * **入口ノード = 太枠** / **出口ノード = 淡色**
  * **クラス内メソッドを横一列（rank=same）**
  * **モジュールクラスタ**（将来の多ファイル解析への布石）
  * **SVGノードにURL/idを埋め込み** + **クリックホットスポット**（GUIでヒットテスト）
* **PEP8チェック**: `flake8`で解析（結果はレポートに保存）
* **リファクタ提案（軽量）**: 長すぎる関数、深すぎるネスト、未使用変数などの指摘
* **検索バー**: `Ctrl+F`、`F3`/`Shift+F3`、ヒットは黄色ハイライト
* **ドラッグ&ドロップ**: `.py` を投下して即解析
* **READMEダイアログ**: Markdown表示
* **PyInstaller対応**: `--onefile` 想定の実装（アイコン同梱可）

#### 特長

* **高精度なAST解析**と**セッション追跡**（`requests.Session()` / `httpx.Client()`）でネットワーク呼び出しを検出
* **with文のI/O検出**（`with open(...) as f:` / `pathlib.Path.open` / `io.open`）
* **SVGクリック → コード行へジャンプ**（双方向連携）
* **行番号ガター**と**検索ハイライト**で読みやすく
* **フレームレス×ガラス風UI**（タイトルバー自作 / 影 / 角丸 / ブランドカラー）
* **最大化=軽量化**でパフォーマンスと美観を両立

---

## 使い方

> README参照。

### 1) 事前インストール

1. **Python 3.10+** を用意します。
2. **Graphviz** を入れます（必須）。

   * Windows: [https://graphviz.org](https://graphviz.org) からインストーラを入れて、**PATHに`dot`を追加**。
   * macOS: `brew install graphviz`
   * Linux: `apt install graphviz`（または各ディストリ）
3. 必要なPythonパッケージを入れます。

   ```bash
   pip install PySide6 PySide6-Addons graphviz flake8
   ```

### 2) 起動

* `PyCodeDictionaryQt.py` を実行します（ダブルクリック or ターミナル）。

  ```bash
  python PyCodeDictionaryQt.py
  ```

### 3) Pythonファイルを読み込む

* 画面上の「**.pyを開く**」ボタンから選択、またはウィンドウ上部の**D\&Dエリア**へ `.py` をドラッグ&ドロップ。
* 解析が走り、左のツリー／中央のエディタ／下部のフローチャートが更新されます。

### 4) 解析結果の見方

* **ツリー**

  * **PEP8**: 行番号付き（ダブルクリックでその行へ）
  * **定義**: `class` → `class.method` → `def func` の順で並び、ダブルクリックで宣言行へジャンプ
  * **呼び出し関係**: `caller → callee`。ダブルクリックで callee の行へ
  * **キーワード**: コード内の用語に簡単な説明
* **エディタ**

  * **行番号ガター**あり
  * `Ctrl+F`で検索バーが開き、入力するとヒット箇所が**黄色ハイライト**されます
  * `Enter`＝次へ、`Shift+Enter`＝前へ、`F3`/`Shift+F3`も使えます
  * `Ctrl+ホイール`で文字の拡大/縮小
* **フローチャート（SVG優先）**

  * **ノードをクリック**すると**対応する行へジャンプ**
  * **色/形**は実行パターンで変化（`async/ジェネレータ/IO/ネット/再帰`）
  * **入口ノード＝太枠 / 出口ノード＝淡色**
  * **エッジ太さ＝呼び出し回数**、回数が複数ならエッジに数字表示
  * **クラスはクラスタ化**され、**メソッドは横一列**で並びます

### 5) エントリ/リーフの指定（任意）

* `config.py` に以下のように書くと、入口/出口ノードを**手動指定**できます。

  ```python
  entry_symbols = ["main", "App.run"]
  leaf_symbols  = ["cleanup", "App.shutdown"]
  ```
* 指定がなければ、解析結果から **入次数=0 → 入口**、**出次数=0 → 出口** を自動判定します。

### 6) レポート出力

* `保存フォルダ`（メニューから開けます）に、解析ログ `*_analysis_with_pep8.txt` と
  フローチャート `*_function_flowchart.(png|svg)`、クリックマップ `*_function_flowchart_map.json` を保存します。

### 7) ショートカット

* `Ctrl+O`：ファイルを開く
* `Ctrl+F`：検索バー表示/非表示
* `F3` / `Shift+F3`：次/前の検索ヒット
* ウィンドウ：**タイトルダブルクリック**で最大化/復元、端の**8px**でリサイズ、ウィンドウ内ドラッグで移動

---

## 注意事項

* **Graphvizが未インストール**/PATH未設定だと、フローチャートのPNG/SVGが出力できません。
* 大きなプロジェクトを解析すると**時間とメモリ**を消費します。必要なファイルに絞って利用ください。
* ネット/I/Oのタグはヒューリスティックです。**100%の網羅性は保証しません**（`pathlib.Path.read_text` など一部は拡張予定）。
* Windowsのフォント環境により、表示が崩れる場合は `utils.UI_FONT_FAMILY` を変更してください（既定は**メイリオ**）。
* SVGのクリック範囲はGraphvizの出力に依存します。まれに**当たり判定がズレる**ことがあります。

---

## ファイル構成

```
PyCodeDictionary/
├─ PyCodeDictionary.py   # 起動用スクリプト（最小限）
├─ gui.py                  # Qt GUI本体（行番号・検索・SVGホットスポット・D&D・メニュー）
├─ processor.py            # AST解析/PEP8/実行パターン/Graphviz出力/クリックマップ生成
├─ utils.py                # QSS/影/フォント/保存パス/タイトル/READMEテキストほか
├─ config.py               # 任意（entry_symbols/leaf_symbols など設定）
├─ assets/
│  └─ pydic.ico             # 任意（PyInstaller同梱用アイコン）
└─ [output]PyCodeDictionary/                 # 解析結果出力フォルダ（自動生成）
```

---

## PyInstaller（任意）

1.簡易ビルド：

   ```bash
   pyinstaller --noconsole ^
  --onefile ^
  --clean ^
  --name PyCodeDictionary ^
  --icon assets\pydic.ico ^
  --add-data "assets\graphviz\win;assets\graphviz\win" ^
  --hidden-import PySide6.QtSvgWidgets ^
  PyCodeDictionary.py

   ```

---

## ライセンス

MIT License ©️ 2025 KisaragiIchigo
