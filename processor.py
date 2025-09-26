import os, re, ast, subprocess, math, textwrap, json
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional, Set
from graphviz import Digraph
from xml.etree import ElementTree as ET

from utils import SAVE_DIR, FONT_PATH, ensure_save_dir, graphviz_available

# --- 用語説明（GUIのツリーで使う） ---
python_keywords_meaning = {
    'False':   '偽を表す論理値',
    'True':    '真を表す論理値',
    'None':    '値がないことを表す特別なオブジェクト',
    'and':     '論理積：両方が真なら真',
    'or':      '論理和：どちらかが真なら真',
    'not':     '論理否定：真偽を反転',
    'is':      '同一性判定：同じオブジェクトか',
    'in':      'メンバーシップ判定：含まれるか',
    'as':      '別名を付ける（with/import で使用）',
    'assert':  '条件が偽なら AssertionError を送出（デバッグ）',
    'async':   '非同期関数（コルーチン）を定義',
    'await':   '非同期処理の完了を待つ',
    'break':   'ループを脱出',
    'continue':'ループの次の反復へスキップ',
    'class':   'クラス定義',
    'def':     '関数定義',
    'del':     '名前/属性/要素のバインディングを解除',
    'elif':    'if の別条件分岐',
    'else':    '条件に当てはまらない場合の分岐',
    'except':  '例外を捕捉',
    'finally': '成否に関わらず最後に必ず実行',
    'for':     'イテラブルを順に走査して繰り返し',
    'from':    'import の一部（from X import Y）',
    'global':  '関数内から**モジュール変数**を再バインド',
    'nonlocal':'外側の関数スコープの変数を再バインド',
    'if':      '条件分岐',
    'import':  'モジュールを読み込む',
    'lambda':  '無名関数（式、単一式のみ）',
    'pass':    '空文（何もしない）',
    'raise':   '例外を送出',
    'return':  '関数を終了し値を返す',
    'try':     '例外が起こる可能性のある処理を保護',
    'while':   '条件が真の間繰り返し',
    'with':    'コンテキストマネージャで前後処理を自動化',
    'yield':   '値を1つ返して関数状態を一時停止（ジェネレータ）',
}

python_builtin_functions_meaning = {
    'abs': '数値の絶対値を返す',
    'all': '反復可能の全要素が真なら True',
    'any': '反復可能のいずれかが真なら True',
    'ascii': '非ASCIIをエスケープした repr 文字列',
    'bin': '整数を 0b 付き2進文字列へ',
    'bool': '真偽値へ変換（真理値判定）',
    'bytearray': '可変のバイト列を生成',
    'bytes': '不変のバイト列を生成',
    'callable': '呼び出し可能オブジェクトか判定',
    'chr': 'Unicodeコードポイントから文字',
    'classmethod': 'クラスメソッド化するデコレータ',
    'compile': 'ソース/文字列→コードオブジェクト',
    'complex': '複素数を生成',
    'delattr': 'オブジェクトの属性を削除',
    'dict': '辞書を生成',
    'dir': '属性名の一覧（ヒント）',
    'divmod': '（商, 余り）のタプル',
    'enumerate': '(index, 要素) を返すイテレータ',
    'eval': '文字列/コードを評価（実行）※慎重に',
    'exec': '文字列/コードを実行 ※慎重に',
    'filter': '述語で絞り込むイテレータを返す',
    'float': '浮動小数点数へ変換',
    'format': 'フォーマット仕様で文字列化',
    'frozenset': '変更不可のセット',
    'getattr': '属性を取得（デフォルト指定可）',
    'globals': 'グローバル名前空間 dict',
    'hasattr': '属性の有無を判定',
    'hash': 'ハッシュ値（整数）を返す',
    'help': 'インタラクティブヘルプ',
    'hex': '整数を 0x 付き16進文字列へ',
    'id': '同一性ID（実装依存）',
    'input': '標準入力から1行取得（文字列）',
    'int': '整数へ変換（基数指定可）',
    'isinstance': 'インスタンス判定（タプル可）',
    'issubclass': 'サブクラス判定（タプル可）',
    'iter': 'イテレータを取得（番兵付き可）',
    'len': '長さ（要素数）',
    'list': 'リストを生成',
    'locals': 'ローカル名前空間 dict（読み取り）',
    'map': '各要素に関数を適用するイテレータ',
    'max': '最大値を返す（key可）',
    'memoryview': 'バッファのメモリビューを生成',
    'min': '最小値を返す（key可）',
    'next': 'イテレータから次要素（既定値可）',
    'object': 'すべての新式クラスの基底',
    'oct': '整数を 0o 付き8進文字列へ',
    'open': 'ファイルを開く（テキスト/バイナリ）',
    'ord': '文字のUnicodeコードポイント',
    'pow': 'べき乗（pow(a,b,mod) も可）',
    'print': '値を出力',
    'property': 'プロパティを定義するデスクリプタ',
    'range': '整数列のイテラブル',
    'repr': '公式的な文字列表現（再現志向）',
    'reversed': 'シーケンスの逆順イテレータ',
    'round': '丸め（最近接偶数への丸め）',
    'set': 'セット（集合）を生成',
    'setattr': '属性を設定',
    'slice': 'スライスオブジェクトを生成',
    'sorted': 'ソート済み新リスト（key, reverse可）',
    'staticmethod': '静的メソッド化するデコレータ',
    'str': '文字列型/文字列化',
    'sum': '合計（start 指定可。数値列）',
    'super': '親クラス参照用プロキシ',
    'tuple': 'タプルを生成',
    'type': '型を返す／メタクラス呼び出し',
    'vars': '__dict__ を返す（引数なしは locals 相当）',
    'zip': '複数イテラブルを並行に束ねる',
    '__import__': '低レベル import 関数（通常は使用しない）',
}


@dataclass
class AnalyzeResult:
    style_issues: List[str]
    refactor_suggestions: List[str]
    function_calls: Dict[str, List[str]]
    def_positions: Dict[str, int]
    def_kinds: Dict[str, str]
    keywords_in_code: Dict[str, str]
    builtins_in_code: Dict[str, str]

def perform_style_check(file_path: str) -> List[str]:
    try:
        out = subprocess.run(['flake8', file_path], capture_output=True, text=True, encoding='utf-8')
        lines = [l for l in out.stdout.splitlines() if l.strip()]
        return lines if lines else []
    except Exception:
        return ["flake8が見つかりませんでした。インストールされているか確認してください。"]

def _nest_depth(node, depth=0) -> int:
    if not hasattr(node, 'body') or not node.body: return depth
    m = depth
    for child in node.body:
        m = max(m, _nest_depth(child, depth+1))
    return m

def suggest_refactoring(code: str) -> List[str]:
    sug = []
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return ["構文エラーが発生しています。コードの構文を確認してください。"]
    if len(re.findall(r'(\w+)\s*=\s*\1', code)) > 3:
        sug.append("同じ処理が繰り返されています。関数化を検討してください。")
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and len(node.body) > 20:
            sug.append(f"関数 '{node.name}' が長すぎます（20行超）。分割を検討。")
    for node in ast.walk(tree):
        if isinstance(node, (ast.If, ast.For, ast.While)) and _nest_depth(node) > 3:
            sug.append("ネストが深すぎる箇所があります。フラット化を検討。")
    used, allv = set(), set()
    for n in ast.walk(tree):
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load): used.add(n.id)
        elif isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store): allv.add(n.id)
    unused = (allv - used) - set(dir(__builtins__))
    if unused: sug.append("未使用の変数: " + ", ".join(sorted(unused)))
    for n in ast.walk(tree):
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and len(n.name) < 3:
            sug.append(f"関数 '{n.name}' の名前が短すぎます。説明的に。")
    if "for " in code and "append(" in code:
        sug.append("リスト作成で for+append が使われています。内包表記を検討。")
    return sug

class AstAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.def_positions: Dict[str, int] = {}
        self.def_kinds: Dict[str, str] = {}
        self.calls: Dict[str, List[str]] = {}
        self._class_stack: List[str] = []
        self._current_symbol: Optional[str] = None
        self._known_methods_by_class: Dict[str, Set[str]] = {}
        self.pattern_tags: Dict[str, Set[str]] = {}
        self._http_sessions: Set[str] = set()

    def _mark_tag(self, key: str, tag: str): self.pattern_tags.setdefault(key, set()).add(tag)

    def visit_ClassDef(self, node: ast.ClassDef):
        cname = node.name
        self.def_positions[cname] = getattr(node, "lineno", 1)
        self.def_kinds[cname] = "class"
        self._known_methods_by_class.setdefault(cname, set())
        self._class_stack.append(cname)
        for b in node.body:
            if isinstance(b, (ast.FunctionDef, ast.AsyncFunctionDef)):
                mname = f"{cname}.{b.name}"
                self.def_positions[mname] = getattr(b, "lineno", 1)
                self.def_kinds[mname] = "method"
                self._known_methods_by_class[cname].add(b.name)
        self.generic_visit(node); self._class_stack.pop()

    def visit_FunctionDef(self, node: ast.FunctionDef): self._handle_function_like(node, False)
    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef): self._handle_function_like(node, True)

    def _handle_function_like(self, node, is_async: bool):
        if self._class_stack: key, kind = f"{self._class_stack[-1]}.{node.name}", "method"
        else:                 key, kind = node.name, "function"
        if key not in self.def_positions:
            self.def_positions[key] = getattr(node, "lineno", 1); self.def_kinds[key] = kind
        self.calls.setdefault(key, [])
        if is_async: self._mark_tag(key, "async")
        if any(isinstance(n, (ast.Yield, ast.YieldFrom)) for n in ast.walk(node)): self._mark_tag(key, "generator")
        prev = self._current_symbol; self._current_symbol = key
        self.generic_visit(node); self._current_symbol = prev

    def visit_Assign(self, node: ast.Assign):
        try:
            if isinstance(node.value, ast.Call):
                s = self._call_full_name(node.value.func)
                if s in ("requests.Session", "httpx.Client"):
                    for tgt in node.targets:
                        if isinstance(tgt, ast.Name): self._http_sessions.add(tgt.id)
        except Exception: pass
        self.generic_visit(node)

    def visit_With(self, node: ast.With):
        if self._current_symbol:
            for item in node.items:
                call = getattr(item, "context_expr", None)
                if isinstance(call, ast.Call):
                    s = self._call_full_name(call.func)
                    if s in ("open", "pathlib.Path.open", "io.open"):
                        self._mark_tag(self._current_symbol, "io")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        callee = self._format_callee(node.func)
        if self._current_symbol and callee:
            if "." not in callee and self._class_stack:
                cls = self._class_stack[-1]
                if callee in self._known_methods_by_class.get(cls, set()):
                    callee = f"{cls}.{callee}"
            self.calls.setdefault(self._current_symbol, []).append(callee)
            base = callee.split(".", 1)[-1]
            if base in ("open","print","read","write","readlines","writelines"): self._mark_tag(self._current_symbol,"io")
            if callee in ("os.system","subprocess.run","subprocess.Popen"): self._mark_tag(self._current_symbol,"io")
            if ("requests." in callee or "httpx." in callee) and base in ("get","post","put","delete","head","options","patch","request","stream"):
                self._mark_tag(self._current_symbol,"net")
            if "." in callee:
                head, meth = callee.split(".",1)
                if head in self._http_sessions and meth.split("(")[0] in ("get","post","put","delete","head","options","patch","request","stream"):
                    self._mark_tag(self._current_symbol,"net")
            if callee == self._current_symbol: self._mark_tag(self._current_symbol,"recursive")
        self.generic_visit(node)

    def _format_callee(self, func) -> Optional[str]:
        if isinstance(func, ast.Name): return func.id
        if isinstance(func, ast.Attribute):
            if isinstance(func.value, ast.Name) and func.value.id == "self" and self._class_stack:
                return f"{self._class_stack[-1]}.{func.attr}"
            if isinstance(func.value, ast.Name): return f"{func.value.id}.{func.attr}"
            return func.attr
        return None

    def _call_full_name(self, func) -> Optional[str]:
        if isinstance(func, ast.Name): return func.id
        if isinstance(func, ast.Attribute):
            left = self._call_full_name(func.value)
            return f"{left}.{func.attr}" if left else func.attr
        return None

def extract_keywords_in_code(code: str):
    words = set(re.findall(r'\b\w+\b', code))
    keys = {k:v for k,v in python_keywords_meaning.items() if k in words}
    built = {k:v for k,v in python_builtin_functions_meaning.items() if k in words}
    return keys, built

@dataclass
class _Shared:
    PATTERN_TAGS: Dict[str, Set[str]]
    MODULE_NAME: str
_SHARED = _Shared(PATTERN_TAGS={}, MODULE_NAME="module")

try:
    import config as _appcfg
    CFG_ENTRY_OVERRIDE = set(getattr(_appcfg, "entry_symbols", []) or [])
    CFG_LEAF_OVERRIDE  = set(getattr(_appcfg, "leaf_symbols",  []) or [])
except Exception:
    CFG_ENTRY_OVERRIDE = set(); CFG_LEAF_OVERRIDE = set()

def analyze_file(code: str, original_path: str) -> AnalyzeResult:
    ensure_save_dir()
    style = perform_style_check(original_path)
    refac = suggest_refactoring(code)
    calls: Dict[str,List[str]] = {}
    def_positions: Dict[str,int] = {}
    def_kinds: Dict[str,str] = {}
    try:
        tree = ast.parse(code)
        az = AstAnalyzer(); az.visit(tree)
        def_positions = dict(az.def_positions)
        def_kinds = dict(az.def_kinds)
        calls = {caller:list(callees) for caller,callees in az.calls.items()}
        for caller,callees in calls.items():
            for c in callees:
                if c not in def_positions:
                    def_positions[c]=1; def_kinds[c]="external"
        _SHARED.PATTERN_TAGS = az.pattern_tags
    except SyntaxError:
        refac = ["構文エラーのためAST解析は一部スキップされました。"]; _SHARED.PATTERN_TAGS={}
    _SHARED.MODULE_NAME = os.path.splitext(os.path.basename(original_path))[0]

    k,b = extract_keywords_in_code(code)

    base = os.path.splitext(os.path.basename(original_path))[0]
    out = os.path.join(SAVE_DIR, f"{base}_analysis_with_pep8.txt")
    try:
        with open(out,"w",encoding="utf-8") as fp:
            fp.write("PEP8スタイルチェック:\n"); fp.writelines("\n".join(style)); fp.write("\n\n")
            fp.write("リファクタリングの提案:\n"); fp.writelines("\n".join(refac)); fp.write("\n\n")
            fp.write("関数/メソッド呼び出し関係(回数込み):\n")
            for fn, cal in calls.items(): fp.write(f"{fn}: {', '.join(cal) if cal else '呼び出しなし'}\n")
            fp.write("\n\n定義位置(行):\n")
            for name, line in sorted(def_positions.items(), key=lambda x: x[1]): fp.write(f"{name}: {line}\n")
            fp.write("\n\nコード内のキーワードと簡易説明:\n")
            for d in (k,b):
                for kk,vv in d.items(): fp.write(f"{kk}: {vv}\n")
    except Exception:
        pass

    return AnalyzeResult(style, refac, calls, def_positions, def_kinds, k, b)

# ========= Graphviz（PNG/SVG + クリックマップJSON） =========
_COLORS = {
    "class":     dict(fill="#FFF2CC", border="#B39B00"),
    "method":    dict(fill="#E8FFF1", border="#00A46C"),
    "function":  dict(fill="#E7F1FF", border="#2B6CB0"),
    "external":  dict(fill="#F0F0F0", border="#888888"),
    "async":     dict(fill="#FFE082", border="#B28704"),
    "generator": dict(fill="#D1C4E9", border="#6A1B9A"),
    "io":        dict(fill="#FFECB3", border="#A86E00"),
    "net":       dict(fill="#B3E5FC", border="#0277BD"),
    "leaf":      dict(fill="#F9FBFF", border=None),
}
_EDGE_PALETTE = ['#5B8FF9','#61DDAA','#65789B','#F6BD16','#7262FD','#78D3F8','#9661BC','#F6903D','#008685','#F08BB4']

def _wrap_label(name: str, width: int = 22) -> str:
    return "\n".join(textwrap.wrap(name, width=width)) if len(name) > width else name

def _dominant_tag(tags: Set[str]) -> Optional[str]:
    for t in ("async","generator","net","io"):
        if t in tags: return t
    return None

def _edge_penwidth(count: int) -> str:
    w = 1.0 + 1.4 * math.log2(max(1, count))
    return f"{min(5.0, max(1.2, w)):.2f}"

def _node_style(name: str, def_kinds: Dict[str,str], entry:Set[str], leaf:Set[str]) -> Dict[str,str]:
    kind = def_kinds.get(name, "function")
    base = _COLORS.get(kind, _COLORS["function"]).copy()
    tags = _SHARED.PATTERN_TAGS.get(name, set())
    dom = _dominant_tag(tags)
    if dom: base["fill"] = _COLORS[dom]["fill"]; base["border"] = _COLORS[dom]["border"]
    style, shape, peripheries = "filled", "rectangle", "1"
    if kind == "class": shape = "ellipse"
    elif kind == "method": style = "rounded,filled"
    if "recursive" in tags: peripheries = "2"
    penwidth = "1.6"
    if name in entry: penwidth = "3"
    if name in leaf:  base["fill"] = _COLORS["leaf"]["fill"]
    return dict(shape=shape, style=style, fillcolor=base["fill"], color=(base["border"] or "#666"),
                peripheries=peripheries, penwidth=penwidth)

def _edge_color(u: str, v: str) -> str:
    for s in (v,u):
        tags = _SHARED.PATTERN_TAGS.get(s, set())
        dom = _dominant_tag(tags)
        if dom: return _COLORS[dom]["border"]
    idx = abs(hash((u,v))) % len(_EDGE_PALETTE)
    return _EDGE_PALETTE[idx]

def _svg_bbox_map(svg_path: str) -> Dict[str, Tuple[float,float,float,float]]:
    ns = {"svg": "http://www.w3.org/2000/svg"}
    try:
        tree = ET.parse(svg_path); root = tree.getroot()
    except Exception:
        return {}
    out: Dict[str, Tuple[float,float,float,float]] = {}
    for g in root.findall(".//svg:g", ns):
        if "node" not in (g.get("class","") or ""): continue
        title_el = g.find("svg:title", ns)
        if title_el is None or not title_el.text: continue
        name = title_el.text.strip()
        ell = g.find(".//svg:ellipse", ns)
        if ell is not None and all(k in ell.attrib for k in ("cx","cy","rx","ry")):
            cx,cy,rx,ry = map(float,[ell.get("cx"),ell.get("cy"),ell.get("rx"),ell.get("ry")])
            out[name]=(cx-rx, cy-ry, rx*2, ry*2); continue
        poly = g.find(".//svg:polygon", ns)
        if poly is not None and "points" in poly.attrib:
            pts = poly.get("points").strip().split()
            xs, ys = [], []
            for p in pts:
                if "," in p:
                    x,y = p.split(",",1)
                    xs.append(float(x)); ys.append(float(y))
            if xs and ys:
                minx, maxx = min(xs), max(xs); miny, maxy = min(ys), max(ys)
                out[name]=(minx, miny, maxx-minx, maxy-miny); continue
    return out

def generate_flowchart_image(function_calls: Dict[str, List[str]], def_kinds: Dict[str,str], base_name: str):
    ensure_save_dir()
    if not graphviz_available():
        return None, None, "Graphviz(dot.exe) が見つかりません。PNG/SVG未出力。"

    indeg: Dict[str,int] = {}
    outdeg: Dict[str,int] = {}
    edge_counts: Dict[Tuple[str,str],int] = {}
    for u, vs in function_calls.items():
        outdeg[u] = outdeg.get(u,0) + len(vs)
        for v in vs:
            indeg[v] = indeg.get(v,0) + 1
            edge_counts[(u,v)] = edge_counts.get((u,v),0) + 1
    nodes = set(def_kinds.keys()) | {u for u,_ in edge_counts} | {v for _,v in edge_counts}
    defined = {n for n in nodes if def_kinds.get(n) in ("class","method","function")}
    entry = {n for n in defined if indeg.get(n,0)==0}
    leaf  = {n for n in defined if outdeg.get(n,0)==0}

    # 手動上書き（config.py 任意）
    try:
        import config as _cfg
        entry |= set(getattr(_cfg, "entry_symbols", []) or [])
        leaf  |= set(getattr(_cfg, "leaf_symbols",  []) or [])
    except Exception:
        pass

    class_members: Dict[str,List[str]] = {}
    for n,k in def_kinds.items():
        if k=="method" and "." in n:
            cls,_ = n.split(".",1)
            class_members.setdefault(cls,[]).append(n)

    dot = Digraph(comment='Function Flowchart')
    if FONT_PATH: dot.attr(fontname=FONT_PATH)
    dot.attr(rankdir='LR', concentrate='true', splines='spline', overlap='false', nodesep='0.6', ranksep='1.0')

    def _add_node(g, name: str):
        st = _node_style(name, def_kinds, entry, leaf)
        url = f"pyjump://{name}"
        g.node(name, label=_wrap_label(name), fontname="Kosugi Maru", id=name, URL=url, **st)

    module_label = _wrap_label(f"module {_SHARED.MODULE_NAME}")
    with dot.subgraph(name=f"cluster_module_{_SHARED.MODULE_NAME}") as m:
        m.attr(label=module_label, color="#5A78FF")
        added = set()
        for cls, members in class_members.items():
            with m.subgraph(name=f"cluster_{cls}") as c:
                c.attr(label=_wrap_label(f"class {cls}"), color=_COLORS["class"]["border"])
                _add_node(c, cls); added.add(cls)
                c.attr(rank="same")
                for meth in sorted(members):
                    _add_node(c, meth); added.add(meth)
        for n in nodes:
            if n in added: continue
            _add_node(m, n)

    for (u,v), cnt in edge_counts.items():
        dot.edge(u, v, arrowhead='normal', arrowsize='0.8',
                 color=_edge_color(u,v), penwidth=_edge_penwidth(cnt),
                 label=str(cnt) if cnt>1 else "", fontname='Kosugi Maru', fontsize="10")

    outstem = os.path.join(SAVE_DIR, f"{base_name}_function_flowchart")
    png_path = svg_path = None
    try: png_path = dot.render(outstem, format='png', cleanup=True)
    except Exception: png_path = None
    try: svg_path = dot.render(outstem, format='svg', cleanup=True)
    except Exception: svg_path = None

    if svg_path and os.path.exists(svg_path):
        try:
            bbox_map = _svg_bbox_map(svg_path)
            with open(outstem + "_map.json", "w", encoding="utf-8") as fp:
                json.dump({"bboxes": bbox_map}, fp, ensure_ascii=False, indent=2)
        except Exception:
            pass

    status = "フローチャート出力（PNG/SVG/マップ）。"
    if not (png_path or svg_path): status = "フローチャート出力に失敗しました。"
    return png_path, svg_path, status

def highlight_positions_in_text(text: str, keyword: str):
    matches = [m.span() for m in re.finditer(rf'\b{re.escape(keyword)}\b', text)]
    return [(s, e - s) for (s, e) in matches]
