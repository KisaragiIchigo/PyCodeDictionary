# CodeDictionary Studio (PyDic v2.0)

**多言語対応・超高速DAGコールグラフ・インテリジェントコード辞書・品質診断を備えた次世代コード解析スタジオ**

PythonコードのAST解析・Graphviz可視化ツールであった `PyDic` を大幅にグレードアップ。  
Pythonに限らず **TypeScript, JavaScript, Rust, Go, C++, SQL, HTML/CSS** などの主要言語をまるごと解析し、外部ツールのインストール不要でブラウザやデスクトップEXE（ポータブル & インストーラー）として瞬時にインタラクティブなフローチャート・構造ツリー・コード辞書・リファクタ提案を提供します。

---

## 🌟 主な機能と特長

1. **多言語ユニバーサル解析エンジン**:
   - Python・TypeScript・JavaScript・Rust・Go・C++等のシンボル（関数・クラス・構造体・メソッド）、階層構造、インポート関係を自動抽出
   - `async` / `I/O` / `ネットワーク通信` / `再帰呼び出し` / `データベース` 等の実行パターンタグを自動判定
2. **超進化型インタラクティブ・コールグラフ & ツリーMAP**:
   - **カーソル中心のスムーズズーム**: 0.15倍（超広域）〜 3.5倍（超拡大）まで、マウス位置を逃さず滑らかに無段階ズーム
   - **ノードダブルクリックでターゲットズーム**: 任意の関数をダブルクリックすると画面中央へ即座にフォーカスズーム
   - **クイックズームプリセット**: `50%` / `100% (等倍)` / `150%` / `全体Fit` を1クリックで即時切り替え
   - **動的データフロー光粒子アニメーション**: エッジ上を流れる光の粒子で関数の呼び出し関係と制御フローを一目で把握
   - **インタラクティブ・レーダーミニマップ**: 右下のミニマップで全体構造と現在位置を常時ナビゲート
   - **役割別ネオングロー & パストレース**: 選択した関数の上流呼び出し元・下流呼び出し先のみを鮮やかにハイライト抽出
3. **言語別インテリジェント・コード辞書 & インタラクティブ解説ラボ**:
   - ソースコード内で使われているキーワードやビルトイン関数・標準モジュールを検出し、日本語で詳細解説
   - **構文アナトミー解剖**: 各単語にマウスを乗せて役割・型注釈・引数をビジュアルに分解解説
   - **ライブ・プレイグラウンド**: その場でコードを編集・即時実行し、コンソール出力をリアルタイム確認
   - **ビジュアル概念シミュレータ**: `async/await` タイムラインや `with` ライフサイクル、ジェネレータストリームの動的図解
   - **1タップ理解度クイズ**: 用語の勘所をミニクイズ形式でサクッと定着
   - **エディタ直接挿入**: 辞書のサンプルコードをワンクリックで作業中エディタへ適用可能
4. **コード品質メトリクス & リファクタリング提案**:
   - 循環的複雑度（Cyclomatic Complexity）、ネスト深度、実コード行数、保守性指標（MI）、ヘルススコア（100点評価）
   - ガード節による早期リターン化、関数のオーケストレーション分割など、具体的な改善案をBefore/After付きで提示
5. **責務細分化 & アーキテクチャ設計スタジオ**:
   - 関数の役割（Orchestrator / Pure Logic / I/O Effect / Validator / Mixed）を自動判定・可視化
   - 混在関数に対するオーケストレーション分解コード雛形（ブループリント）の自動生成
6. **フォルダ一括検知 & プロジェクト全体依存MAP**:
   - ディレクトリ全体の複数コードを一括スキャンし、ファイル間依存MAPと統合マスター辞書を構築
7. **多彩なエクスポート機能**:
   - SVGベクター画像、Markdown総合レポート、JSON構造化データのワンクリック出力

---

## 🚀 起動方法と使い方

### 1. 起動（開発モード）
ルートディレクトリにある **`起動.bat`** をダブルクリックします。  
（初回実行時は自動的に `npm install` が実行され、ブラウザで開発サーバーが起動します）

```bash
# ターミナルから起動する場合
npm install
npm run dev
```

### 2. コンパイル（単独EXE & インストーラーEXEの生成）
ルートディレクトリにある **`コンパイル.bat`** をダブルクリックします。  
自動的に TypeScript / Vite バンドルと Electron パッケージングが走り、**`release/`** フォルダ配下に以下の2つのWindows実行ファイルが自動出力されます：

1. **`CodeDictionary Studio-Portable-2.0.0.exe`** : インストール不要で即座にどこでも起動できる単独ポータブル版EXE
2. **`CodeDictionary Studio-Setup-2.0.0.exe`** : インストール先選択・デスクトップ/スタートメニューショートカット作成・アンインストーラー登録に対応したインストーラー型EXE

```bash
# ターミナルからEXEをビルドする場合
npm run build:exe
```

---

## 📁 ディレクトリ構成

```
PyDic/
├── package.json                # プロジェクト設定 & 依存関係定義
├── electron-builder.json5      # Portable & NSIS インストーラーパッケージング設定
├── vite.config.ts              # Vite & Electron プラグイン設定
├── tailwind.config.js          # Tailwind CSS設定
├── postcss.config.js           # PostCSS設定
├── tsconfig.json               # TypeScript設定
├── index.html                  # アプリケーションHTMLエントリ
├── project_style.json          # スタイル・カラーパレット・トークン定義（単一情報源）
├── changelogs.json             # 変更履歴
├── README.md                   # 総合ドキュメント（本ファイル）
├── 起動.bat                    # ワンクリック起動バッチ
├── コンパイル.bat              # ワンクリックEXEビルドバッチ（release/ への出力）
│
├── release/                    # 【ビルド成果物出力フォルダ】
│   ├── CodeDictionary Studio-Portable-2.0.0.exe   # ① 単独起動ポータブル版EXE
│   └── CodeDictionary Studio-Setup-2.0.0.exe      # ② インストーラー型EXE
│
├── electron/                   # Electron メイン & プリロード
│   ├── main.ts                 # ウィンドウ生成・セキュアIPC・ライフサイクル
│   └── preload.ts              # ContextBridge 経由の安全なAPI公開
│
├── src/                        # React + TypeScript UI & コアエンジン
│   ├── types/                  # 型定義（SymbolNode, CallEdge, DictEntry, Metrics等）
│   ├── core/
│   │   ├── parser/             # 多言語パーサー（Python, TS/JS, Rust, Go, Generic）
│   │   ├── dictionary/         # 言語別コード辞書（Python, JS/TS, Rust, Go）
│   │   ├── metrics/            # 循環的複雑度・品質・リファクタ提案エンジン
│   │   ├── architecture/       # 役割判定・凝集度診断・ブループリント生成
│   │   ├── multiFile/          # プロジェクト全体スキャン & 依存MAP
│   │   ├── graph/              # DAG階層レイアウトエンジン & エクスポーター
│   │   ├── presets/            # 各言語のサンプルコード集
│   │   └── analyzer.ts         # 総合解析オーケストレータ
│   ├── components/             # UIコンポーネント群
│   ├── App.tsx                 # アプリケーション全体オーケストレータ
│   └── main.tsx                # Reactマウントエントリ
│
├── build/                      # アプリアイコン等
├── public/                     # 静的アセット
│
└── 削除/                       # 【退避フォルダ】旧作Python版資産一式
    ├── PyCodeDictionary.py
    ├── gui.py
    ├── processor.py
    ├── utils.py
    ├── PyCodeDictionary.spec
    ├── !exe化呪文.txt
    ├── RED.txt
    ├── rere.txt
    ├── assets/
    └── assets.zip
```

---

## ⌨️ ショートカットキー

| ショートカット / 操作 | 機能 |
| :--- | :--- |
| **`Ctrl + F`** | コード内検索バーの表示 |
| **`Enter` / `Shift + Enter`** | 次 / 前の検索ヒット箇所へジャンプ |
| **グラフのドラッグ** | フローチャートのパン（視点移動） |
| **マウスホイール** | フローチャートのズームイン / ズームアウト |
| **ノードをクリック** | エディタの該当コード行へスムーズフォーカス |
| **ファイルをD&D** | 画面上にファイルをドロップして即時解析 |
| **境界スプリッターのドラッグ** | エディタとMAPの表示領域サイズを自由に伸縮 |

---

## 🛠️ 技術スタック

- **Desktop Framework**: Electron 43 + electron-builder
- **UI Framework**: React 18
- **Language**: TypeScript 5
- **Bundler**: Vite 5
- **Styling**: Tailwind CSS v3 (Dark Acrylic Design)
- **Icons**: Lucide React
- **Packaging Targets**: NSIS Setup EXE (Installer) + Portable Standalone EXE
- **Graph Engine**: Custom Topological Layered DAG Layout Engine
