import { SymbolNode, CallEdge, PatternTag, ImportEntry } from '../../types';

const PYTHON_STANDARD_MODULES = new Set([
  'os', 'sys', 'math', 'json', 're', 'time', 'datetime', 'random', 'collections',
  'itertools', 'functools', 'pathlib', 'typing', 'dataclasses', 'asyncio', 'threading',
  'multiprocessing', 'subprocess', 'shutil', 'tempfile', 'csv', 'sqlite3', 'urllib',
  'http', 'logging', 'argparse', 'unittest', 'contextlib', 'copy', 'enum', 'hashlib',
  'io', 'pickle', 'queue', 'socket', 'ssl', 'struct', 'traceback', 'uuid', 'warnings'
]);

interface RawFuncInfo {
  id: string;
  name: string;
  kind: 'function' | 'method';
  parentName?: string;
  startLine: number;
  endLine: number;
  params: string[];
  returnType?: string;
  docstring?: string;
  decorators: string[];
  tags: PatternTag[];
  bodyCode: string;
  calls: string[];
}

export function parsePythonCode(code: string): {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  imports: ImportEntry[];
} {
  const lines = code.split('\n');
  const symbols: SymbolNode[] = [];
  const rawFuncs: RawFuncInfo[] = [];
  const imports: ImportEntry[] = [];

  let currentClass: string | null = null;
  let currentClassIndent = 0;
  let accumulatedDecorators: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // 0. インポート文の抽出
    const importMatch = trimmed.match(/^import\s+([A-Za-z0-9_.,\s]+)/);
    const fromImportMatch = trimmed.match(/^from\s+([A-Za-z0-9_.]+)\s+import\s+([A-Za-z0-9_.,*\s()]+)/);

    if (importMatch) {
      const moduleNames = importMatch[1].split(',').map(m => m.trim().split(/\s+as\s+/)[0]);
      for (const mod of moduleNames) {
        imports.push({
          source: mod,
          symbols: [mod],
          isStandardLib: PYTHON_STANDARD_MODULES.has(mod.split('.')[0]),
          line: lineNum
        });
      }
      continue;
    } else if (fromImportMatch) {
      const mod = fromImportMatch[1];
      const syms = fromImportMatch[2].replace(/[()]/g, '').split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
      imports.push({
        source: mod,
        symbols: syms,
        isStandardLib: PYTHON_STANDARD_MODULES.has(mod.split('.')[0]),
        line: lineNum
      });
      continue;
    }

    // デコレータの蓄積 (@decorator)
    if (trimmed.startsWith('@')) {
      accumulatedDecorators.push(trimmed);
      continue;
    }

    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;

    // クラススコープ脱出の判定
    if (currentClass && indent <= currentClassIndent && !trimmed.startsWith('def ') && !trimmed.startsWith('async def ')) {
      currentClass = null;
    }

    // 1. クラス定義
    const classMatch = line.match(/^(\s*)class\s+([A-Za-z0-9_]+)(?:\((.*?)\))?:/);
    if (classMatch) {
      currentClassIndent = classMatch[1].length;
      const className = classMatch[2];
      const basesRaw = classMatch[3];
      currentClass = className;

      const extendsClasses = basesRaw
        ? basesRaw.split(',').map(b => b.trim()).filter(Boolean)
        : [];

      // クラスdocstringの抽出
      let classDoc: string | undefined = undefined;
      for (let k = i + 1; k < Math.min(lines.length, i + 5); k++) {
        const nextT = lines[k].trim();
        if (nextT.startsWith('"""') || nextT.startsWith("'''")) {
          classDoc = nextT.replace(/^["']{3}|["']{3}$/g, '').trim();
          break;
        }
      }

      symbols.push({
        id: `class-${className}`,
        name: className,
        kind: 'class',
        startLine: lineNum - accumulatedDecorators.length,
        endLine: lineNum,
        docstring: classDoc,
        decorators: [...accumulatedDecorators],
        extendsClasses,
        tags: [],
        calls: []
      });

      accumulatedDecorators = [];
      continue;
    }

    // 2. 関数 / メソッド定義
    const funcMatch = line.match(/^(\s*)(async\s+)?def\s+([A-Za-z0-9_]+)\s*\((.*?)\)(?:\s*->\s*(.*?))?:/);
    if (funcMatch) {
      const isAsync = !!funcMatch[2];
      const funcName = funcMatch[3];
      const paramsRaw = funcMatch[4];
      const returnType = funcMatch[5] ? funcMatch[5].trim() : undefined;
      const isMethod = currentClass !== null && indent > currentClassIndent;

      const symbolId = isMethod ? `${currentClass}.${funcName}` : funcName;
      const kind = isMethod ? 'method' : 'function';

      const params = paramsRaw
        ? paramsRaw.split(',').map(p => p.trim()).filter(Boolean)
        : [];

      // 関数本体の終了行を探す
      let endLine = lineNum;
      const funcIndent = indent;
      const bodyLines: string[] = [];
      let docstring: string | undefined = undefined;

      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        const nextTrimmed = nextLine.trim();
        if (!nextTrimmed) {
          endLine = j + 1;
          continue;
        }

        // docstringの抽出
        if (!docstring && (nextTrimmed.startsWith('"""') || nextTrimmed.startsWith("'''"))) {
          docstring = nextTrimmed.replace(/^["']{3}|["']{3}$/g, '').trim();
        }

        const nextIndent = nextLine.match(/^(\s*)/)?.[1].length || 0;
        if (nextIndent <= funcIndent && !nextTrimmed.startsWith('#')) {
          break;
        }
        bodyLines.push(nextLine);
        endLine = j + 1;
      }

      const bodyCode = bodyLines.join('\n');

      // パターンタグ判定
      const tags: PatternTag[] = [];
      if (isAsync) tags.push('async');
      if (/yield\s+/.test(bodyCode)) tags.push('generator');

      // I/O
      if (/with\s+open\(|open\(|\.read\(|\.write\(|\.read_text\(|\.write_text\(|os\.path|pathlib\.Path/.test(bodyCode)) {
        tags.push('io');
      }

      // ネットワーク
      if (/requests\.|httpx\.|aiohttp\.|urllib|socket|fetch|session\.get|session\.post|client\.get/.test(bodyCode)) {
        tags.push('net');
      }

      // 再帰
      if (new RegExp(`\\b${funcName}\\s*\\(`).test(bodyCode)) {
        tags.push('recursive');
      }

      // DB
      if (/sqlite3|psycopg2|sqlalchemy|cursor\.execute|session\.query|\.filter_by|\.save\(/.test(bodyCode)) {
        tags.push('database');
      }

      // メモ化・デコレータタグ
      if (accumulatedDecorators.some(d => d.includes('lru_cache') || d.includes('cache'))) {
        tags.push('memoized');
      }
      if (accumulatedDecorators.some(d => d.includes('deprecated'))) {
        tags.push('deprecated');
      }

      rawFuncs.push({
        id: symbolId,
        name: isMethod ? `${currentClass}.${funcName}` : funcName,
        kind,
        parentName: isMethod ? currentClass! : undefined,
        startLine: lineNum - accumulatedDecorators.length,
        endLine,
        params,
        returnType,
        docstring,
        decorators: [...accumulatedDecorators],
        tags,
        bodyCode,
        calls: []
      });

      accumulatedDecorators = [];
    }
  }

  // 3. 呼び出し関係（Call Graph）の解決
  const shortNamesToFull = new Map<string, string[]>();
  for (const f of rawFuncs) {
    const short = f.name.includes('.') ? f.name.split('.').pop()! : f.name;
    const list = shortNamesToFull.get(short) || [];
    list.push(f.name);
    shortNamesToFull.set(short, list);
  }

  const callEdgesMap = new Map<string, CallEdge>();

  for (const caller of rawFuncs) {
    const callerLines = caller.bodyCode.split('\n');

    for (let idx = 0; idx < callerLines.length; idx++) {
      const curLineText = callerLines[idx];
      const curLineNum = caller.startLine + idx + 1;

      for (const [shortName, fullNames] of shortNamesToFull.entries()) {
        const callRegex = new RegExp(`(?:self\\.|cls\\.|\\b)${shortName}\\s*\\(`, 'g');
        if (callRegex.test(curLineText)) {
          for (const targetFullName of fullNames) {
            if (!caller.calls.includes(targetFullName)) {
              caller.calls.push(targetFullName);
            }

            const edgeKey = `${caller.name}->${targetFullName}`;
            if (!callEdgesMap.has(edgeKey)) {
              callEdgesMap.set(edgeKey, {
                id: `edge-${edgeKey}`,
                source: caller.name,
                target: targetFullName,
                sourceName: caller.name,
                targetName: targetFullName,
                count: 1,
                lines: [curLineNum]
              });
            } else {
              const existing = callEdgesMap.get(edgeKey)!;
              existing.count += 1;
              if (!existing.lines.includes(curLineNum)) {
                existing.lines.push(curLineNum);
              }
            }
          }
        }
      }
    }

    symbols.push({
      id: caller.id,
      name: caller.name,
      kind: caller.kind,
      parentName: caller.parentName,
      startLine: caller.startLine,
      endLine: caller.endLine,
      parameters: caller.params,
      returnType: caller.returnType,
      docstring: caller.docstring,
      decorators: caller.decorators,
      tags: caller.tags,
      calls: caller.calls
    });
  }

  // クラスの endLine を調整
  for (const sym of symbols) {
    if (sym.kind === 'class') {
      const childMethods = symbols.filter(s => s.parentName === sym.name);
      if (childMethods.length > 0) {
        sym.endLine = Math.max(...childMethods.map(m => m.endLine));
      }
    }
  }

  return {
    symbols: symbols.sort((a, b) => a.startLine - b.startLine),
    callEdges: Array.from(callEdgesMap.values()),
    imports
  };
}
