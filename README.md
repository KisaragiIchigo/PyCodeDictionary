# CodeDictionary Studio (PyDic v2.0)

**多言語AST解析・自律DAGコールグラフ・実行シミュレータ・インテリジェントコード辞書・Big-O計算量診断・アーキテクチャ設計スタジオを備えた次世代コード解析環境**

PythonのAST解析・Graphviz可視化ツールであった `PyDic` をフルスタックで全面刷新。  
Pythonに限らず **TypeScript, JavaScript, Rust, Go, C++, SQL, HTML/CSS** などの主要言語をまるごと解析し、外部ツールのインストール不要でブラウザやデスクトップEXE（ポータブル & インストーラー）として瞬時にインタラクティブなフローチャート・AST構文木・コード辞書・実行シミュレーション・リファクタ提案を提供します。

---

## 🌟 主な機能と特長

1. **多言語AST（抽象構文木）解析 & インタラクティブASTエクスプローラー**:
   - **本物のASTパーサーエンジン**: Python, TypeScript/JavaScript, Rust, Go, C++等の抽象構文木を再帰的に生成
   - **双方向ツリー連動**: サイドバーの「🌳 AST構文木」からノード（`FunctionDef`, `ClassDef`, `CallExpression` 等）をクリックすると、エディタ上の該当トークン・行へ瞬時にジャンプ＆ネオン発光
   - **ASTノード・インスペクター & 構文辞書**: 選択中ノードの引数・戻り値型・演算子・開始終了位置と、コンパイラ/静的解析における役割を詳細解説
2. **超進化型インタラクティブ・コールグラフ (DAG)**:
   - **カーソル中心のスムーズズーム & パン**: 0.25倍〜2.5倍まで無段階ズーム、全体Fit
   - **レーダーミニマップ**: 右下のミニマップで全体構造と現在フォーカス位置を常時ナビゲート
   - **役割別ネオングロー & パストレース**: 選択した関数の上流呼び出し元（紫）・下流呼び出し先（緑）のみを鮮やかにハイライト抽出
   - **クラス・クラスタリング**: クラスごとに点線枠で囲んでメソッド群を自動グルーピング
3. **ライブ・実行フロー・シミュレーター (Execution Flow Player)**:
   - **「▶ 実行シミュレーション」** ボタンを押すと、エントリポイントから関数が呼び出されていく実行順序に合わせて**ノードとエッジが順番にパルス発光しながらステップアニメーション再生**
4. **アルゴリズム時間計算量（Big-O）自動予測**:
   - ネストループの深さ、多重再帰、内部ソートアルゴリズムを構文木レベルで走査
   - ノード上およびホバーカードに `O(1)`, `O(n)`, `O(n log n)`, `O(n^2)`, `O(2^n)` のバッジを表示し、ボトルネックの行番号と原因を提示
5. **言語別インテリジェント・コード辞書**:
   - ソースコード内のキーワードやビルトイン関数・標準モジュールを検出し、日本語で詳細解説
   - **インライン辞書ホバー**: エディタ上の単語にカーソルを乗せるだけで、型・docstring・辞書解説がポップアップ
   - **出現箇所（Usages）展開 & 逆引きジャンプ**: 辞書用語をクリックすると、ファイル内の全出現行を展開し1クリックでジャンプ
6. **責務細分化 & オーケストレーション設計スタジオ**:
   - 関数のアーキテクチャ役割（`👑 司令塔 (Orchestrator)` / `⚡ 計算層 (Pure Logic)` / `🌐 通信・I/O (Effect)` / `🛡️ 検証層 (Validator)` / `⚠️ 混在 (Mixed)`）を自動判定・可視化
   - 混在関数に対するオーケストレーション分解コード雛形（ブループリント）の自動生成
7. **ワンクリック・リファクタ適用 (One-Click Refactoring)**:
   - 品質診断やアーキテクチャ診断で提案されたリファクタコード（責務分離や複雑度削減）の **「✨ 適用」** ボタンを押すだけで、エディタ上のコードに直接反映
8. **フォルダ一括検知 & プロジェクト全体依存MAP**:
   - ディレクトリ全体の複数コードファイルを一括スキャンし、モジュール間依存MAPと全ファイル統合マスター辞書を構築
9. **自由自在なワークスペース・リサイザー**:
   - エディタ vs MAP の境界線をマウスドラッグで伸縮可能（`3:7` / `5:5` / `7:3` プリセット、ダブルクリックでリセット）
10. **多彩なエクスポート機能**:
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
├── 起動.bat                    # ワンクリック起動バッチ（Shift-JIS安全仕様）
├── コンパイル.bat              # ワンクリックEXEビルドバッチ（Shift-JIS安全仕様）
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
│   ├── types/                  # 型定義
│   │   ├── index.ts            # 総合型定義（SymbolNode, CallEdge, DictEntry, Metrics等）
│   │   └── ast.ts              # ASTノード型定義（ASTNode, ASTLocation等）
│   │
│   ├── hooks/                  # カスタムフック群（オーケストレーション層）
│   │   ├── useProjectState.ts  # プロジェクト・ファイル・解析状態管理
│   │   ├── useLayoutState.ts   # ワークスペース比率・サイドバー幅・分割管理
│   │   ├── useCanvasNavigation.ts # キャンバスパン・ズーム・全体Fit操作
│   │   ├── useSimulationPlayer.ts # 実行シミュレーションタイマー・進行制御
│   │   └── usePathTracer.ts    # 上流・下流パストレース計算
│   │
│   ├── core/                   # 解析コアエンジン
│   │   ├── ast/                # AST解析エンジン（Python, TS/JS, 汎用, AST構文辞書）
│   │   ├── parser/             # 多言語パーサー（Python, TS/JS, Rust, Go, Generic）
│   │   ├── dictionary/         # 言語別コード辞書（Python, JS/TS, Rust, Go, AST）
│   │   ├── metrics/            # 循環的複雑度・認知負荷・Big-O計算量・セキュリティ診断
│   │   ├── architecture/       # 役割判定・凝集度診断・ブループリント生成
│   │   ├── multiFile/          # プロジェクト全体スキャン & 依存MAP
│   │   ├── graph/              # DAG階層レイアウトエンジン & エクスポーター
│   │   ├── presets/            # 各言語のサンプルコード集
│   │   └── analyzer.ts         # 総合解析オーケストレータ
│   │
│   ├── components/             # UIコンポーネント群
│   │   ├── layout/             # ワークスペースレイアウトコンポーネント
│   │   │   └── WorkspaceLayout.tsx # エディタ & MAP & サイドバー描画
│   │   ├── flowchart/          # フローチャート個別描画コンポーネント
│   │   │   ├── FlowchartNode.tsx   # ノード描画（Big-Oバッジ、役割バッジ）
│   │   │   ├── FlowchartEdge.tsx   # SVGエッジ描画（ベジエ、パストレース）
│   │   │   ├── FlowchartMinimap.tsx# レーダーミニマップ
│   │   │   ├── FlowchartToolbar.tsx# フローチャート上部ツールバー
│   │   │   └── FlowchartTooltip.tsx# ホバーインスペクターカード
│   │   ├── ASTExplorer.tsx     # AST構文木エクスプローラー
│   │   ├── CodeViewer.tsx      # Monaco風コードエディタ（辞書ホバー・Usages展開）
│   │   ├── FlowchartView.tsx   # フローチャートオーケストレータ
│   │   ├── DictionaryPanel.tsx # コード辞書パネル
│   │   ├── ArchitecturePanel.tsx # 設計 & 責務パネル
│   │   ├── QualityPanel.tsx    # 品質 & セキュリティ & リファクタパネル
│   │   ├── ProjectExplorer.tsx # フォルダツリーエクスプローラー
│   │   ├── ProjectMapView.tsx  # プロジェクト全体依存関係MAP
│   │   ├── Header.tsx          # アプリケーションヘッダー
│   │   ├── ExportModal.tsx     # エクスポートモーダル
│   │   └── HelpModal.tsx       # ヘルプモーダル
│   │
│   ├── App.tsx                 # アプリケーション最上位オーケストレータ (~130行)
│   └── main.tsx                # Reactマウントエントリ
│
├── build/                      # アプリアイコン等
├── public/                     # 静的アセット
│
└── 削除/                       # 【退避フォルダ】旧作Python版資産一式
```

---

## ⌨️ ショートカットキー & 操作

| ショートカット / 操作 | 機能 |
| :--- | :--- |
| **`Ctrl + F`** | コード内検索バーの表示 |
| **`Enter` / `Shift + Enter`** | 次 / 前の検索ヒット箇所へジャンプ |
| **グラフのドラッグ** | フローチャートのパン（視点移動） |
| **マウスホイール** | フローチャートのズームイン / ズームアウト |
| **「▶ 実行シミュレーション」** | コードの実行順序をフローチャート上でステップ再生 |
| **ASTノードをクリック** | エディタの該当トークン・構文行へジャンプ |
| **コード上の単語にホバー** | インライン辞書ポップアップ（定義・型・解説） |
| **ノードをクリック** | エディタの該当コード行へスムーズフォーカス |
| **ファイルをD&D** | 画面上にファイルをドロップして即時解析 |
| **境界スプリッターのドラッグ** | エディタとMAPの表示領域サイズを自由に伸縮 |
| **リファクタの「適用」** | 提案された改善コードをエディタに直接反映 |

---

## 🛠️ 技術スタック

- **Desktop Framework**: Electron 43 + electron-builder
- **UI Framework**: React 18
- **Language**: TypeScript 5
- **Bundler**: Vite 5
- **Styling**: Tailwind CSS v3 (Dark Acrylic Design)
- **Icons**: Lucide React
- **Packaging Targets**: NSIS Setup EXE (Installer) + Portable Standalone EXE
- **AST Engine**: Custom Recursive AST Parser & Inspector
- **Graph Engine**: Custom Topological Layered DAG Layout Engine
- **Complexity Analyzer**: Cyclomatic, Cognitive & Big-O Estimation Engine
