import os, sys, re, json
from PySide6.QtCore import Qt, QEvent, QPoint, QPropertyAnimation, QEasingCurve, QRect, QSize
from PySide6.QtGui import (
    QIcon, QColor, QFont, QAction, QTextCursor, QTextCharFormat, QPainter, QFontMetrics
)
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QStyle,
    QTreeWidget, QTreeWidgetItem, QFileDialog, QSplitter, QGraphicsView, QGraphicsScene,
    QDialog, QTextBrowser, QApplication, QPlainTextEdit, QLineEdit, QTextEdit, QGraphicsRectItem
)
from PySide6.QtSvgWidgets import QGraphicsSvgItem  # SVG表示用

from utils import (
    build_qss, apply_drop_shadow, apply_text_shadow, UI_FONT_FAMILY, MENU_WIDTH, RESIZE_MARGIN,
    ensure_save_dir, get_icon_path, APP_TITLE, README_MD, SAVE_DIR
)
from processor import (
    analyze_file, generate_flowchart_image, highlight_positions_in_text
)


# CodeEditor: 行番号ガター

class LineNumberArea(QWidget):
    def __init__(self, editor):
        super().__init__(editor)
        self.editor = editor
    def sizeHint(self):
        return QSize(self.editor.line_number_area_width(), 0)
    def paintEvent(self, event):
        self.editor.line_number_area_paint_event(event)

class CodeEditor(QPlainTextEdit):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._line_area = LineNumberArea(self)
        self.blockCountChanged.connect(self._update_line_number_area_width)
        self.updateRequest.connect(self._update_line_number_area)
        self.cursorPositionChanged.connect(self._highlight_current_line)
        self._update_line_number_area_width(0)
        self._search_positions = []
        self._search_index = -1

        f = self.font()
        f.setFamily(UI_FONT_FAMILY)  
        f.setPointSize(10)
        f.setStyleHint(QFont.Monospace)
        self.setFont(f)

        self.setLineWrapMode(QPlainTextEdit.NoWrap)
        self.setTabStopDistance(QFontMetrics(self.font()).horizontalAdvance(" ") * 4)

    def line_number_area_width(self) -> int:
        digits = max(3, len(str(max(1, self.blockCount()))))
        fm = QFontMetrics(self.font())
        return 10 + fm.horizontalAdvance('9') * digits

    def _update_line_number_area_width(self, _):
        self.setViewportMargins(self.line_number_area_width(), 0, 0, 0)

    def line_number_area_paint_event(self, event):
        painter = QPainter(self._line_area)
        painter.fillRect(event.rect(), QColor(15, 30, 60, 180))
        block = self.firstVisibleBlock()
        blockNumber = block.blockNumber()
        top = self.contentOffset().y() + self.blockBoundingGeometry(block).translated(self.contentOffset()).top()
        bottom = top + self.blockBoundingRect(block).height()
        fm = QFontMetrics(self.font())
        while block.isValid() and top <= event.rect().bottom():
            if block.isVisible() and bottom >= event.rect().top():
                number = str(blockNumber + 1)
                painter.setPen(QColor("#b8dcff"))
                painter.drawText(0, int(top), self._line_area.width()-6, fm.height(),
                                 Qt.AlignRight | Qt.AlignVCenter, number)
            block = block.next()
            top = bottom
            bottom = top + self.blockBoundingRect(block).height()
            blockNumber += 1

    def resizeEvent(self, e):
        super().resizeEvent(e)
        cr = self.contentsRect()
        self._line_area.setGeometry(QRect(cr.left(), cr.top(), self.line_number_area_width(), cr.height()))

    def _update_line_number_area(self, rect, dy):
        if dy:
            self._line_area.scroll(0, dy)
        else:
            self._line_area.update(0, rect.y(), self._line_area.width(), rect.height())
        if rect.contains(self.viewport().rect()):
            self._update_line_number_area_width(0)

    def _highlight_current_line(self):
        sels = []
        fmt_line = QTextCharFormat()
        fmt_line.setBackground(QColor(70, 110, 225, 60))
        sel_line = QTextEdit.ExtraSelection()  # PySide6は QTextEdit.ExtraSelection
        sel_line.cursor = self.textCursor()
        sel_line.format = fmt_line
        sels.append(sel_line)

        for (start, length) in getattr(self, "_search_positions", []):
            c = self.textCursor()
            c.setPosition(start)
            c.setPosition(start + length, QTextCursor.KeepAnchor)
            f = QTextCharFormat()
            f.setBackground(QColor(255,255,0,150))
            f.setForeground(QColor(200,0,0))
            e = QTextEdit.ExtraSelection()
            e.cursor = c; e.format = f
            sels.append(e)
        self.setExtraSelections(sels)

    def highlight_search(self, pattern: str, case_sensitive: bool=False, use_regex: bool=False, whole_word: bool=False):
        import re
        self._search_positions = []
        if not pattern:
            self._search_index = -1
            self._highlight_current_line()
            return
        flags = 0 if case_sensitive else re.IGNORECASE
        if not use_regex: pattern = re.escape(pattern)
        if whole_word:    pattern = r"\b" + pattern + r"\b"
        text = self.toPlainText()
        try:
            regex = re.compile(pattern, flags)
        except re.error:
            self._search_index = -1
            self._highlight_current_line()
            return
        for m in regex.finditer(text):
            self._search_positions.append((m.start(), m.end()-m.start()))
        self._search_index = 0 if self._search_positions else -1
        self._highlight_current_line()
        if self._search_index >= 0:
            self._goto_pos(self._search_positions[0][0])

    def find_next(self):
        if not self._search_positions: return
        self._search_index = (self._search_index + 1) % len(self._search_positions)
        self._goto_pos(self._search_positions[self._search_index][0])

    def find_prev(self):
        if not self._search_positions: return
        self._search_index = (self._search_index - 1) % len(self._search_positions)
        self._goto_pos(self._search_positions[self._search_index][0])

    def _goto_pos(self, pos: int):
        c = self.textCursor()
        c.setPosition(pos)
        self.setTextCursor(c)
        self.centerCursor()
        self._highlight_current_line()

    def goto_line(self, line: int):
        if line < 1: line = 1
        doc = self.document()
        blk = doc.findBlockByLineNumber(line-1)
        if blk.isValid():
            c = QTextCursor(blk)
            self.setTextCursor(c)
            self.centerCursor()
            self._highlight_current_line()

    def wheelEvent(self, e):
        if e.modifiers() & Qt.ControlModifier:
            delta = e.angleDelta().y()
            f = self.font()
            f.setPointSize(max(6, f.pointSize() + (1 if delta>0 else -1)))
            self.setFont(f)
            self._update_line_number_area_width(0)
            e.accept(); return
        super().wheelEvent(e)


# 検索バー

class SearchBar(QWidget):
    def __init__(self, editor: 'CodeEditor | None' = None, parent=None):
        super().__init__(parent)
        self.setObjectName("searchBar")
        self.editor: CodeEditor | None = None
        lay = QHBoxLayout(self); lay.setContentsMargins(8,6,8,6); lay.setSpacing(6)
        self.edit = QLineEdit(); self.edit.setObjectName("searchEdit"); self.edit.setPlaceholderText("検索 (Enter=次へ / Shift+Enter=前へ)")
        self.btn_prev = QPushButton("◀"); self.btn_next = QPushButton("▶")
        lay.addWidget(self.edit, 1); lay.addWidget(self.btn_prev); lay.addWidget(self.btn_next)
        self.edit.returnPressed.connect(self._return_pressed)
        self.btn_next.clicked.connect(self._on_next)
        self.btn_prev.clicked.connect(self._on_prev)
        self.edit.textChanged.connect(self._on_text_changed)
        if editor is not None:
            self.set_editor(editor)
        self.hide()

    def set_editor(self, editor: 'CodeEditor'):
        self.editor = editor

    def _return_pressed(self):
        if not self.editor: return
        if QApplication.keyboardModifiers() & Qt.ShiftModifier:
            self.editor.find_prev()
        else:
            self.editor.find_next()

    def _on_next(self):
        if self.editor: self.editor.find_next()

    def _on_prev(self):
        if self.editor: self.editor.find_prev()

    def _on_text_changed(self, s: str):
        if self.editor: self.editor.highlight_search(s)


# D&D ドロップエリア

class DropArea(QLabel):
    def __init__(self, on_files):
        super().__init__("ここにファイルをドラッグ＆ドロップ")
        self.setObjectName("dropArea")
        self.setAcceptDrops(True)
        self._callback = on_files
    def dragEnterEvent(self, e):
        if e.mimeData().hasUrls(): e.acceptProposedAction()
    def dropEvent(self, e):
        files = [u.toLocalFile() for u in e.mimeData().urls()]
        if files:
            self.setText("ドロップされたファイル:\n" + "\n".join(files))
            self._callback(files)


# README ダイアログ

class ReadmeDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowFlags(Qt.Dialog | Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.resize(850, 600)
        outer = QVBoxLayout(self); outer.setContentsMargins(0,0,0,0)
        bg = QWidget(); bg.setObjectName("bgRoot"); outer.addWidget(bg)
        bgLay = QVBoxLayout(bg); bgLay.setContentsMargins(10,10,10,10)
        card = QWidget(); card.setObjectName("glassRoot"); bgLay.addWidget(card)
        self._shadow = apply_drop_shadow(card)
        lay = QVBoxLayout(card); lay.setContentsMargins(12,12,12,12)
        bar = QHBoxLayout()
        title = QLabel("README ©️2025 KisaragiIchigo"); title.setObjectName("titleLabel")
        bar.addWidget(title); bar.addStretch()
        btn_close = QPushButton("x"); btn_close.setObjectName("closeBtn"); btn_close.setFixedSize(28,28); btn_close.clicked.connect(self.accept)
        bar.addWidget(btn_close); lay.addLayout(bar)
        viewCard = QWidget(); viewCard.setObjectName("textPanel")
        v = QVBoxLayout(viewCard); v.setContentsMargins(8,8,8,8)
        viewer = QTextBrowser(); viewer.setObjectName("readmeText")
        viewer.setOpenExternalLinks(True); viewer.setMarkdown(README_MD)
        v.addWidget(viewer); lay.addWidget(viewCard, 1)
        self.setStyleSheet(build_qss(compact=False))


# SVG ホットスポット

class HotSpotItem(QGraphicsRectItem):
    def __init__(self, rect, name: str, jump_cb):
        super().__init__(rect)
        self.setPen(QColor(0,0,0,0))   # 透明枠
        self.setBrush(QColor(0,0,0,0)) # 透明塗り
        self.setAcceptHoverEvents(True)
        self.name = name
        self.jump_cb = jump_cb
    def hoverEnterEvent(self, e):
        self.setPen(QColor(0,0,0,80))
        self.setBrush(QColor(0,120,255,40))
        super().hoverEnterEvent(e)
    def hoverLeaveEvent(self, e):
        self.setPen(QColor(0,0,0,0))
        self.setBrush(QColor(0,0,0,0))
        super().hoverLeaveEvent(e)
    def mousePressEvent(self, e):
        if e.button()==Qt.LeftButton and self.jump_cb:
            self.jump_cb(self.name); e.accept()
        else:
            super().mousePressEvent(e)
    def setToolTipText(self, text: str):
        self.setToolTip(text)


# メインウィンドウ

class MainWindow(QWidget):
    ROLE_DECL_LINE = Qt.UserRole + 1
    ROLE_PEP8_LINE = Qt.UserRole + 2
    ROLE_SYMBOL_NAME = Qt.UserRole + 3

    def __init__(self):
        super().__init__()
        self.setWindowTitle(f"{APP_TITLE} ©️2025 KisaragiIchigo")
        self.resize(1000, 900)
        self.setMinimumSize(50, 50)
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self._moving = False
        I = QPoint()  # dummy
        self._resizing = False
        self._drag_offset = QPoint()
        self._start_mouse = None
        self._start_geo = None
        self._resize_edges = ""
        self._menu_visible = False

        # アイコン
        icon_path = get_icon_path()
        if os.path.exists(icon_path): self.setWindowIcon(QIcon(icon_path))
        else: self.setWindowIcon(self.style().standardIcon(QStyle.SP_ComputerIcon))

        outer = QVBoxLayout(self); outer.setContentsMargins(0,0,0,0)
        self.bg = QWidget(); self.bg.setObjectName("bgRoot"); outer.addWidget(self.bg)
        rootLay = QVBoxLayout(self.bg); rootLay.setContentsMargins(10,10,10,10)
        self.card = QWidget(); self.card.setObjectName("glassRoot"); rootLay.addWidget(self.card)
        self._shadow = apply_drop_shadow(self.card)
        main = QVBoxLayout(self.card); main.setContentsMargins(16,16,16,16)

        # タイトルバー
        bar = QHBoxLayout()
        title = QLabel(APP_TITLE); title.setObjectName("titleLabel"); apply_text_shadow(title)
        title.mouseDoubleClickEvent = lambda e: self._toggle_max_restore()
        self.btn_menu  = QPushButton("≡");   self._style_title_btn(self.btn_menu, role="menu")   # 28x28固定
        self.btn_menu.clicked.connect(lambda: self._toggle_menu(True))
        self.btn_readme = QPushButton("ReadMe"); self._style_title_btn(self.btn_readme, role="readme")  # 幅可変・高28
        self.btn_readme.clicked.connect(self._show_readme)
        self.btn_min   = QPushButton("_");   self._style_title_btn(self.btn_min, role="min")
        self.btn_min.clicked.connect(self.showMinimized)
        self.btn_max   = QPushButton("🗖");  self._style_title_btn(self.btn_max, role="max")
        self.btn_max.clicked.connect(self._toggle_max_restore)
        self.btn_close = QPushButton("x");   self._style_title_btn(self.btn_close, role="close")
        self.btn_close.clicked.connect(self.close)
        bar.addWidget(title)
        bar.addWidget(self.btn_menu)
        bar.addStretch()
        bar.addWidget(self.btn_readme)  # ReadMeは最小化の左
        bar.addWidget(self.btn_min)
        bar.addWidget(self.btn_max)
        bar.addWidget(self.btn_close)
        main.addLayout(bar)

        # 上部操作
        tool = QHBoxLayout()
        self.btn_open = QPushButton(".pyを開く"); self.btn_open.clicked.connect(self._pick_file)
        self.drop = DropArea(self._on_files_dropped); self.drop.setFixedHeight(48)
        tool.addWidget(self.btn_open); tool.addWidget(self.drop, 1)
        main.addLayout(tool)

        # 中央：ツリー/コード/フロービュー
        self.tree = QTreeWidget(); self.tree.setHeaderHidden(True)
        self.tree.itemDoubleClicked.connect(self._on_tree_double_clicked)

        self.code = CodeEditor(); self.code.setReadOnly(True)
        self.searchBar = SearchBar(self.code, self)
        main.addWidget(self.searchBar)

        self.flowview = QGraphicsView(); self.flowview.setScene(QGraphicsScene()); self.flowview.setMinimumHeight(220)

        split_lr = QSplitter(); split_lr.setOrientation(Qt.Horizontal)
        split_lr.addWidget(self.tree); split_lr.addWidget(self.code); split_lr.setSizes([260, 520])
        main.addWidget(split_lr, 1)
        main.addWidget(self.flowview, 0)

        # ステータス
        self.status = QLabel("準備OK"); apply_text_shadow(self.status)
        main.addWidget(self.status)

        # オーバーレイ&メニュー
        self.overlay = QWidget(self); self.overlay.setObjectName("overlay")
        self.overlay.setGeometry(0,0,0,0); self.overlay.hide()
        self.overlay.mousePressEvent = lambda e: self._toggle_menu(False)

        self.menu = QWidget(self); self.menu.setObjectName("menuPanel")
        self.menu.setGeometry(-MENU_WIDTH,0,MENU_WIDTH,self.height())

        mlay = QVBoxLayout(self.menu); mlay.setContentsMargins(10,12,10,12)
        cbar = QHBoxLayout(); cbar.addWidget(QLabel("メニュー")); b = QPushButton("⇐"); b.clicked.connect(lambda: self._toggle_menu(False))
        cbar.addStretch(); cbar.addWidget(b); mlay.addLayout(cbar)
        mlay.addWidget(self._make_menu_button("README", self._show_readme))
        mlay.addWidget(self._make_menu_button("保存フォルダを開く", self._open_save_dir))
        mlay.addStretch()

        self.menu_anim = QPropertyAnimation(self.menu, b"geometry", self)
        self.menu_anim.setDuration(220)
        self.menu_anim.setEasingCurve(QEasingCurve.OutCubic)
        self.menu_anim.finished.connect(self._after_menu_anim)

        # 初期スタイル
        self._apply_compact(self.isMaximized())
        self.bg.setMouseTracking(True); self.bg.installEventFilter(self)
        ensure_save_dir()
        self.current_file = None
        self.current_code = ""
        self.def_positions = {}
        self.def_kinds = {}

        # ショートカット
        self._sc_open  = QAction(self); self._sc_open.setShortcut("Ctrl+O"); self._sc_open.triggered.connect(self._pick_file); self.addAction(self._sc_open)
        self._sc_readme= QAction(self); self._sc_readme.setShortcut("Ctrl+R"); self._sc_readme.triggered.connect(self._show_readme); self.addAction(self._sc_readme)
        self._sc_find  = QAction(self); self._sc_find.setShortcut("Ctrl+F"); self._sc_find.triggered.connect(self._toggle_searchbar); self.addAction(self._sc_find)
        self._sc_next  = QAction(self); self._sc_next.setShortcut("F3"); self._sc_next.triggered.connect(lambda: self.code.find_next()); self.addAction(self._sc_next)
        self._sc_prev  = QAction(self); self._sc_prev.setShortcut("Shift+F3"); self._sc_prev.triggered.connect(lambda: self.code.find_prev()); self.addAction(self._sc_prev)

    # ---- タイトルバー小ボタン ----
    def _style_title_btn(self, btn: QPushButton, role: str | None = None):
        """
        役割:
          - "min"/"max"/"close": 28x28固定（小ボタン）
          - "menu": 28x28固定（ハンバーガー）
          - "readme": 幅可変・高さ28（テキストが潰れない）
          - None: 幅可変・高さ28
        """
        if role in ("min","max","close","menu"):
            btn.setFixedSize(28,28)
        else:
            btn.setMinimumHeight(28)
        if role == "min":    btn.setObjectName("minBtn")
        elif role == "max":  btn.setObjectName("maxBtn")
        elif role == "close":btn.setObjectName("closeBtn")

    def _make_menu_button(self, text, slot):
        b = QPushButton(text); b.setProperty("class","menuItem"); b.clicked.connect(slot); return b

    # ---- 検索バー ----
    def _toggle_searchbar(self):
        if self.searchBar.isHidden():
            self.searchBar.show(); self.searchBar.edit.setFocus(); self.searchBar.edit.selectAll()
        else:
            self.searchBar.hide(); self.code.setFocus()

    # ---- ファイル処理 ----
    def _pick_file(self):
        file, _ = QFileDialog.getOpenFileName(self, ".py を選択", "", "Python (*.py)")
        if file: self._load_and_analyze(file)

    def _on_files_dropped(self, files):
        for f in files:
            if f.lower().endswith(".py"):
                self._load_and_analyze(f); break

    def _load_and_analyze(self, path: str):
        try:
            with open(path, "r", encoding="utf-8") as fp:
                code = fp.read()
        except Exception as e:
            self.status.setText(f"読み込み失敗: {e}")
            return
        self.current_file = path
        self.current_code = code
        self.code.setPlainText(code)
        self.status.setText(f"解析中: {os.path.basename(path)}")

        result = analyze_file(code, path)
        self.def_positions = result.def_positions
        self.def_kinds = result.def_kinds
        self._fill_tree(result)

        base = os.path.splitext(os.path.basename(path))[0]
        png_path, svg_path, msg = generate_flowchart_image(result.function_calls, result.def_kinds, base)
        self._show_flow_image(svg_path, png_path)
        tail = f"（SVG: 出力済み）" if svg_path else ""
        self.status.setText(f"解析完了: {os.path.basename(path)} → {os.path.join(SAVE_DIR, base+'_analysis_with_pep8.txt')} / {msg} {tail}")

    # ---- ツリー構築 ----
    def _fill_tree(self, result):
        self.tree.clear()
        pep = QTreeWidgetItem(self.tree, ["PEP8スタイルチェック"])
        pep_pat = re.compile(r":(\d+):(\d+):\s*([A-Z]\d+)\s*(.*)")
        for line in result.style_issues or ["(問題なし or flake8未検出)"]:
            item = QTreeWidgetItem(pep, [line])
            m = pep_pat.search(line)
            if m:
                item.setData(0, self.ROLE_PEP8_LINE, int(m.group(1)))

        ref = QTreeWidgetItem(self.tree, ["リファクタリングの提案"])
        for s in result.refactor_suggestions or ["(特になし)"]:
            QTreeWidgetItem(ref, [s])

        defs_root = QTreeWidgetItem(self.tree, ["定義（行番号）"])
        classes = sorted([n for n,k in result.def_kinds.items() if k=="class"], key=lambda n: result.def_positions.get(n,0))
        methods = [n for n,k in result.def_kinds.items() if k=="method"]
        methods_by_class = {}
        for m in methods:
            cls, meth = m.split(".",1)
            methods_by_class.setdefault(cls, []).append(m)
        for cls in classes:
            ci = QTreeWidgetItem(defs_root, [f"class {cls} (L{result.def_positions.get(cls,0)})"])
            ci.setData(0, self.ROLE_DECL_LINE, result.def_positions.get(cls,0))
            ci.setData(0, self.ROLE_SYMBOL_NAME, cls)
            for m in sorted(methods_by_class.get(cls, []), key=lambda n: result.def_positions.get(n,0)):
                mi = QTreeWidgetItem(ci, [f"def {m} (L{result.def_positions.get(m,0)})"])
                mi.setData(0, self.ROLE_DECL_LINE, result.def_positions.get(m,0))
                mi.setData(0, self.ROLE_SYMBOL_NAME, m)
        funcs = sorted([n for n,k in result.def_kinds.items() if k=="function"], key=lambda n: result.def_positions.get(n,0))
        for f in funcs:
            fi = QTreeWidgetItem(defs_root, [f"def {f} (L{result.def_positions.get(f,0)})"])
            fi.setData(0, self.ROLE_DECL_LINE, result.def_positions.get(f,0))
            fi.setData(0, self.ROLE_SYMBOL_NAME, f)

        calls_root = QTreeWidgetItem(self.tree, ["関数/メソッドの呼び出し関係"])
        for caller, callees in result.function_calls.items():
            parent = QTreeWidgetItem(calls_root, [caller])
            parent.setData(0, self.ROLE_SYMBOL_NAME, caller)
            parent.setData(0, self.ROLE_DECL_LINE, result.def_positions.get(caller, 0))
            for c in callees:
                it = QTreeWidgetItem(parent, [c])
                if c in result.def_positions:
                    it.setData(0, self.ROLE_DECL_LINE, result.def_positions.get(c, 0))
                    it.setData(0, self.ROLE_SYMBOL_NAME, c)

        keys = QTreeWidgetItem(self.tree, ["キーワードと簡易説明"])
        for k, v in {**result.keywords_in_code, **result.builtins_in_code}.items():
            QTreeWidgetItem(keys, [f"{k}: {v}"])

        self.tree.expandToDepth(1)

    # ---- ツリーのダブルクリック ----
    def _on_tree_double_clicked(self, item: QTreeWidgetItem):
        line = item.data(0, self.ROLE_PEP8_LINE)
        if isinstance(line, int) and line > 0:
            self.code.goto_line(line); return
        decl = item.data(0, self.ROLE_DECL_LINE)
        if isinstance(decl, int) and decl > 0:
            self.code.goto_line(decl); return
        text = item.text(0)
        if ":" in text:
            key = text.split(":")[0].strip()
            positions = highlight_positions_in_text(self.current_code, key)
            if positions:
                self.code._search_positions = positions
                self.code._search_index = 0
                self.code._goto_pos(positions[0][0])

    # ---- Flow画像表示（SVG優先 + ホットスポット） ----
    def _show_flow_image(self, svg_path: str | None, png_path: str | None):
        scene = QGraphicsScene()
        self.flowview.setScene(scene)
        if svg_path and os.path.exists(svg_path):
            item = QGraphicsSvgItem(svg_path)
            scene.addItem(item)
            scene.setSceneRect(item.boundingRect())
            map_path = os.path.splitext(svg_path)[0] + "_map.json"
            if os.path.exists(map_path):
                try:
                    with open(map_path, "r", encoding="utf-8") as fp:
                        data = json.load(fp)
                    bboxes = data.get("bboxes", {})
                    for name, rect in bboxes.items():
                        if not isinstance(rect, (list, tuple)) or len(rect) != 4:
                            continue
                        x,y,w,h = rect
                        hs = HotSpotItem(QRect(int(x), int(y), int(w), int(h)), name, self._jump_to_symbol)
                        line = self.def_positions.get(name, 0)
                        hs.setToolTipText(f"{name}  (L{line})  —  クリックでジャンプ")
                        scene.addItem(hs)
                except Exception as e:
                    print("hotspot load error:", e)
        else:
            from PySide6.QtGui import QPixmap
            if png_path and os.path.exists(png_path):
                pix = QPixmap(png_path)
                scene.addPixmap(pix)
                scene.setSceneRect(pix.rect())
        if not scene.sceneRect().isEmpty():
            self.flowview.fitInView(scene.sceneRect(), Qt.KeepAspectRatio)

    def _jump_to_symbol(self, name: str):
        line = self.def_positions.get(name)
        if isinstance(line, int) and line>0:
            self.code.goto_line(line)
        elif name in self.def_positions:
            self.code.goto_line(self.def_positions[name])

    # ---- メニュー（重なり順修正）----
    def _toggle_menu(self, show: bool | None = None):
        if show is None: show = not self._menu_visible
        h = self.height()
        self.menu.setFixedHeight(h)

        # overlay は常に menu の「下」に配置して、クリックは overlay が受け持ち
        self.overlay.setGeometry(0, 0, self.width(), h)
        self.overlay.show()
        self.menu.show()

        # ★ 重なり順を修正：overlay を下げ、menu を上げる
        try:
            self.overlay.stackUnder(self.menu)
        except Exception:
            # 念のためのフォールバック
            self.overlay.lower()
            self.menu.raise_()

        if show:
            start = QRect(-MENU_WIDTH, 0, MENU_WIDTH, h)
            end   = QRect(0, 0, MENU_WIDTH, h)
        else:
            start = QRect(self.menu.geometry())
            end   = QRect(-MENU_WIDTH, 0, MENU_WIDTH, h)

        self._next_menu = show
        self.menu_anim.stop()
        self.menu_anim.setStartValue(start)
        self.menu_anim.setEndValue(end)
        self.menu_anim.start()

    def _after_menu_anim(self):
        self._menu_visible = self._next_menu
        if not self._menu_visible:
            self.menu.hide()
            self.overlay.hide()

    # ---- ウィンドウ制御/スタイル ----
    def _toggle_max_restore(self):
        if self.isMaximized(): self.showNormal()
        else: self.showMaximized()

    def _apply_compact(self, compact: bool):
        self.setStyleSheet(build_qss(compact))
        self._shadow.setEnabled(not compact)
        self.btn_max.setText("❏" if self.isMaximized() else "🗖")

    def changeEvent(self, e):
        super().changeEvent(e)
        if e.type() == QEvent.WindowStateChange:
            self._apply_compact(self.isMaximized())

    # ---- フレームレス移動/リサイズ ----
    def eventFilter(self, obj, e):
        if obj is self.bg:
            if e.type() == QEvent.MouseButtonPress and e.button() == Qt.LeftButton:
                pos = self.mapFromGlobal(e.globalPosition().toPoint())
                edges = self._edge_at(pos)
                if edges:
                    self._resizing = True; self._resize_edges = edges
                    self._start_geo = self.geometry(); self._start_mouse = e.globalPosition().toPoint()
                else:
                    self._moving = True; self._drag_offset = e.globalPosition().toPoint() - self.frameGeometry().topLeft()
                return True
            elif e.type() == QEvent.MouseMove:
                if self._resizing:
                    self._resize_to(e.globalPosition().toPoint()); return True
                if self._moving and (e.buttons() & Qt.LeftButton) and not self.isMaximized():
                    self.move(e.globalPosition().toPoint() - self._drag_offset); return True
                self._update_cursor(self._edge_at(self.mapFromGlobal(e.globalPosition().toPoint())))
            elif e.type() == QEvent.MouseButtonRelease:
                self._resizing = False; self._moving = False; return True
        return super().eventFilter(obj, e)

    def _edge_at(self, pos):
        m = RESIZE_MARGIN; r = self.bg.rect(); edges = ""
        if pos.y() <= m: edges += "T"
        if pos.y() >= r.height()-m: edges += "B"
        if pos.x() <= m: edges += "L"
        if pos.x() >= r.width()-m: edges += "R"
        return edges

    def _update_cursor(self, edges):
        if edges in ("TL","BR"): self.setCursor(Qt.SizeFDiagCursor)
        elif edges in ("TR","BL"): self.setCursor(Qt.SizeBDiagCursor)
        elif edges in ("L","R"): self.setCursor(Qt.SizeHorCursor)
        elif edges in ("T","B"): self.setCursor(Qt.SizeVerCursor)
        else: self.setCursor(Qt.ArrowCursor)

    def _resize_to(self, gpos):
        dx = gpos.x() - self._start_mouse.x()
        dy = gpos.y() - self._start_mouse.y()
        g = self._start_geo; x,y,w,h = g.x(),g.y(),g.width(),g.height()
        minw, minh = self.minimumSize().width(), self.minimumSize().height()
        if "L" in self._resize_edges:
            new_w = max(minw, w - dx); x += (w-new_w); w = new_w
        if "R" in self._resize_edges:
            w = max(minw, w + dx)
        if "T" in self._resize_edges:
            new_h = max(minh, h - dy); y += (h-new_h); h = new_h
        if "B" in self._resize_edges:
            h = max(minh, h + dy)
        self.setGeometry(x, y, w, h)

    # ---- その他 ----
    def _show_readme(self):
        dlg = ReadmeDialog(self)
        dlg.move(self.frameGeometry().center() - dlg.rect().center())
        dlg.exec()

    def _open_save_dir(self):
        path = os.path.abspath(SAVE_DIR); os.makedirs(path, exist_ok=True)
        if os.name == "nt":
            os.startfile(path)  # type: ignore[attr-defined]
        else:
            from subprocess import Popen
            Popen(["open" if sys.platform=="darwin" else "xdg-open", path])


if __name__ == "__main__":
    app = QApplication(sys.argv)
    w = MainWindow()
    w.show()
    sys.exit(app.exec())
