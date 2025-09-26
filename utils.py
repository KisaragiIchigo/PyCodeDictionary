import os, sys, shutil, textwrap
from typing import Optional
from PySide6.QtCore import Qt
from PySide6.QtGui import QColor, QFont
from PySide6.QtWidgets import QGraphicsDropShadowEffect

# ====== アプリ定数 ======
APP_TITLE = "PyCodeDictionary Qt"
UI_FONT_FAMILY = "メイリオ"
MENU_WIDTH = 220
RESIZE_MARGIN = 8

# 保存先
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVE_DIR = os.path.join(BASE_DIR, "[output]PyCodeDictionary")
os.makedirs(SAVE_DIR, exist_ok=True)

# フォント（Graphviz向けに任意）
FONT_PATH = ""

# README
README_MD = textwrap.dedent("""\
# PyCodeDictionary ©️2025 KisaragiIchigo

## このツールについて
Pythonファイルを読み込んで **コードをAST解析** し、
- クラス / メソッド / 関数 の定義位置
- 関数呼び出しの関係
- PEP8 スタイルチェック結果
- リファクタリングの提案

をまとめて表示してくれるツールです。  
さらに **Graphviz** を使って、呼び出し関係をフローチャートにして PNG / SVG に出力します。  
SVGをクリックすれば、対応するコード行にジャンプすることもできます。

---

## 主な機能
- **行番号付きエディタ**：検索ハイライト、Ctrl+ホイールで文字サイズ変更
- **PEP8 チェック**：flake8 を呼び出してスタイル警告を表示
- **リファクタ提案**：関数が長すぎる／ネストが深すぎる／未使用変数 などを検出
- **呼び出し関係グラフ**：
  - エッジの太さ＝呼び出し回数
  - `async` / `generator` / `I/O` / `ネットワーク` 呼び出しは色分け
  - 入口ノード＝太枠、出口ノード＝淡色
  - クラス内メソッドは横並びに整列
- **ドラッグ＆ドロップ対応**：.py ファイルを投下して解析
- **READMEダイアログ**：この説明をGUI内で確認可能

---

## 使い方
1. 上部の「.pyを開く」ボタン、またはウィンドウへ `.py` ファイルをドラッグ＆ドロップ
2. 左側のツリーで解析結果を確認
   - PEP8 警告をダブルクリック → 対応行へジャンプ
   - 関数やメソッドをダブルクリック → 定義行へジャンプ
3. 下部のフローチャートで呼び出し関係を視覚的に確認
   - ノードクリック → エディタでコード位置へジャンプ

---

## 注意
- フローチャート出力には Graphviz が必要です。
  PyInstaller版では Graphviz を同梱しているので、追加インストール不要で動きます。
- 大規模プロジェクトを読み込むと処理が重くなる場合があります。
- ネットワーク/I/O 検出はヒューリスティックなので完全ではありません。

""")

# ====== QSS / 見た目 ======
def build_qss(compact: bool) -> str:
    glass_bg = "rgba(16,22,40,0.82)" if not compact else "rgba(16,22,40,1.0)"
    return f"""
* {{
  font-family: "{UI_FONT_FAMILY}";
}}
#bgRoot {{
  background: transparent;
}}
#glassRoot {{
  background: {glass_bg};
  border: 3px solid #4169e1;
  border-radius: 18px;
}}
#titleLabel {{
  color: #ffffff; font-weight: bold; font-size: 16px;
}}
#overlay {{
  background: rgba(0,0,0,0.15);
}}
QTreeWidget {{
  background: rgba(255,250,250,0.92);
  color: #000;
  border-radius: 10px;
  padding: 6px;
}}
QPlainTextEdit {{
  background: #fffafa; color: #000; border: 1px solid #888; border-radius: 10px;
}}
QLineEdit, QDateEdit {{
  background: #fffafa; color: #000; border: 1px solid #888; border-radius: 8px; height: 28px;
}}
QCheckBox::indicator {{
  width: 16px; height: 16px; border: 1px solid #888; background: #fffafa;
}}
QCheckBox::indicator:hover {{
  border: 1px solid #4169e1;
}}
QCheckBox::indicator:checked {{
  background: #4169e1;
}}
QRadioButton::indicator {{
  width: 14px; height: 14px; border-radius: 7px; border: 1px solid #888; background: #fffafa;
}}
QRadioButton::indicator:hover {{
  border: 1px solid #4169e1;
}}
QRadioButton::indicator:checked {{
  background: qradialgradient(spread:pad, cx:0.5, cy:0.5, radius:0.8, fx:0.5, fy:0.5, stop:0 #ffffff, stop:1 #4169e1);
}}
QPushButton {{
  background: #4169e1; color: #ffffff; border: none; border-radius: 8px; padding: 6px 12px;
}}
QPushButton:hover {{
  background: #7000e0;
}}
#minBtn {{ color: #FFD600; background: transparent; }}
#maxBtn {{ color: #00C853; background: transparent; }}
#closeBtn {{ color: #FF0000; background: transparent; }}
#minBtn:hover, #maxBtn:hover, #closeBtn:hover {{
  background: rgba(255,255,255,0.08);
  border-radius: 6px;
}}
#dropArea {{
  background: rgba(25,25,112,0.5);
  color: #177ee6;
  border: 2px dashed #4169e1;
  border-radius: 10px;
  padding: 8px;
}}
#searchBar {{
  background: rgba(255,255,255,0.9);
  border-radius: 10px;
  padding: 6px;
}}
#readmeText {{
  background: #333333; color: #fffafa; border-radius: 10px;
}}
#textPanel {{
  background: #222; color: #fff; border: 1px solid #555; border-radius: 10px; padding: 8px;
}}
"""

def apply_drop_shadow(widget):
    eff = QGraphicsDropShadowEffect(widget)
    eff.setBlurRadius(24); eff.setOffset(0, 6); eff.setColor(QColor(0,0,0,180))
    widget.setGraphicsEffect(eff); return eff

def apply_text_shadow(label):
    eff = QGraphicsDropShadowEffect(label)
    eff.setBlurRadius(8); eff.setOffset(1,1); eff.setColor(QColor(192,192,192,110))
    label.setGraphicsEffect(eff); return eff

def ensure_save_dir():
    os.makedirs(SAVE_DIR, exist_ok=True); return SAVE_DIR

def get_icon_path() -> str:
    cands = []
    if hasattr(sys, "_MEIPASS"):
        cands.append(os.path.join(sys._MEIPASS, "assets", "pydic.ico"))
    cands.append(os.path.join(BASE_DIR, "assets", "pydic.ico"))
    for c in cands:
        if os.path.exists(c): return c
    return ""



def _app_home() -> str:
    return os.path.join(os.getenv("LOCALAPPDATA", os.path.expanduser("~")), "PyCodeDictionary")

def _target_root() -> str:
    return os.path.join(_app_home(), "graphviz_bin", "win")

def _dot_filename() -> str:
    return "dot.exe"

def get_bundled_graphviz_srcdir() -> Optional[str]:
    rel = os.path.join("assets", "graphviz", "win")
    if hasattr(sys, "_MEIPASS"):
        p = os.path.join(sys._MEIPASS, rel)
        if os.path.exists(p): return p
    p = os.path.join(BASE_DIR, rel)
    return p if os.path.exists(p) else None

def ensure_graphviz() -> Optional[str]:
    """
    同梱Graphvizをユーザー領域に展開。既存ならスルー。
    戻り値: dot.exe のフルパス or None
    """
    src = get_bundled_graphviz_srcdir()
    target = _target_root()
    bin_dir = os.path.join(target, "bin")
    dot_path = os.path.join(bin_dir, _dot_filename())
    try:
        os.makedirs(bin_dir, exist_ok=True)
        if not os.path.exists(dot_path):
            if not src:
                return None
            shutil.copytree(src, target, dirs_exist_ok=True)
        return dot_path if os.path.exists(dot_path) else None
    except Exception:
        return None

def set_graphviz_on_path() -> bool:
    """
    PATHに dot.exe を通す。既にPATHにあればTrue。
    同梱があれば展開して PATH 先頭に bin を追加。
    """
    from shutil import which
    if which("dot"):
        return True
    dot_path = ensure_graphviz()
    if not dot_path:
        return False
    bin_dir = os.path.dirname(dot_path)
    env_path = os.environ.get("PATH", "")
    if bin_dir not in env_path.split(os.pathsep):
        os.environ["PATH"] = bin_dir + os.pathsep + env_path
    return which("dot") is not None

def graphviz_available() -> bool:
    from shutil import which
    if which("dot"):
        return True
    return set_graphviz_on_path()
