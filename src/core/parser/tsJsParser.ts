import { SymbolNode, CallEdge, PatternTag, ImportEntry } from '../../types';

interface RawJsFunc {
  id: string;
  name: string;
  kind: 'function' | 'method';
  parentName?: string;
  startLine: number;
  endLine: number;
  params: string[];
  returnType?: string;
  docstring?: string;
  decorators?: string[];
  isExported: boolean;
  tags: PatternTag[];
  bodyCode: string;
  calls: string[];
}

export function parseTsJsCode(code: string): {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  imports: ImportEntry[];
} {
  const lines = code.split('\n');
  const symbols: SymbolNode[] = [];
  const rawFuncs: RawJsFunc[] = [];
  const imports: ImportEntry[] = [];

  let currentClass: string | null = null;
  let accumulatedJSDoc: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;

    // 0. JSDoc コメントの蓄積 (/** ... */)
    if (trimmed.startsWith('/**')) {
      const docLines: string[] = [trimmed];
      let endDocLine = i;
      for (let k = i + 1; k < lines.length; k++) {
        const nextLine = lines[k].trim();
        docLines.push(nextLine);
        if (nextLine.endsWith('*/')) {
          endDocLine = k;
          break;
        }
      }
      accumulatedJSDoc = docLines
        .join(' ')
        .replace(/^\/\*\*|\*\/$/g, '')
        .replace(/\s*\*\s*/g, ' ')
        .trim();
      i = endDocLine;
      continue;
    }

    // 1. インポート文の抽出 (import { A, B } from 'C';)
    const importMatch = trimmed.match(/^import\s+(?:type\s+)?(?:([A-Za-z0-9_]+)|\{([^}]+)\}|\*\s+as\s+([A-Za-z0-9_]+))\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const source = importMatch[4];
      const defaultImport = importMatch[1];
      const namedImports = importMatch[2] ? importMatch[2].split(',').map(s => s.trim().split(/\s+as\s+/)[0]) : [];
      const nsImport = importMatch[3];

      const importedSymbols = [
        ...(defaultImport ? [defaultImport] : []),
        ...namedImports,
        ...(nsImport ? [nsImport] : [])
      ];

      const isStandardLib = !source.startsWith('.') && !source.startsWith('/');

      imports.push({
        source,
        symbols: importedSymbols,
        isStandardLib,
        line: lineNum
      });
      continue;
    }

    // 2. Interface 定義
    const ifaceMatch = trimmed.match(/^(?:export\s+)?interface\s+([A-Za-z0-9_]+)(?:<.*?>)?(?:\s+extends\s+([^{]+))?/);
    if (ifaceMatch) {
      const extendsClasses = ifaceMatch[2]
        ? ifaceMatch[2].split(',').map(s => s.trim()).filter(Boolean)
        : [];

      symbols.push({
        id: `iface-${ifaceMatch[1]}`,
        name: ifaceMatch[1],
        kind: 'interface',
        startLine: lineNum,
        endLine: lineNum,
        docstring: accumulatedJSDoc,
        extendsClasses,
        isExported: trimmed.startsWith('export'),
        tags: [],
        calls: []
      });
      accumulatedJSDoc = undefined;
      continue;
    }

    // 3. Type Alias
    const typeMatch = trimmed.match(/^(?:export\s+)?type\s+([A-Za-z0-9_]+)(?:<.*?>)?\s*=/);
    if (typeMatch) {
      symbols.push({
        id: `type-${typeMatch[1]}`,
        name: typeMatch[1],
        kind: 'type',
        startLine: lineNum,
        endLine: lineNum,
        docstring: accumulatedJSDoc,
        isExported: trimmed.startsWith('export'),
        tags: [],
        calls: []
      });
      accumulatedJSDoc = undefined;
      continue;
    }

    // 4. Class 定義
    const classMatch = trimmed.match(/^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_]+)(?:<.*?>)?(?:\s+extends\s+([A-Za-z0-9_]+))?(?:\s+implements\s+([^{]+))?/);
    if (classMatch) {
      const className = classMatch[1];
      const extendsClass = classMatch[2];
      const implementsRaw = classMatch[3];
      currentClass = className;

      symbols.push({
        id: `class-${className}`,
        name: className,
        kind: 'class',
        startLine: lineNum,
        endLine: lineNum,
        docstring: accumulatedJSDoc,
        extendsClasses: extendsClass ? [extendsClass] : [],
        implementsInterfaces: implementsRaw ? implementsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
        isExported: trimmed.startsWith('export'),
        tags: [],
        calls: []
      });
      accumulatedJSDoc = undefined;
      continue;
    }

    // 5. 関数 / メソッド定義
    const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function(?:\s*\*|\s+)?([A-Za-z0-9_]+)?\s*(?:<.*?>)?\s*\((.*?)\)(?:\s*:\s*([^{]+))?/);
    const arrowMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?(?:\((.*?)\)|([A-Za-z0-9_]+))\s*(?::\s*([^{=]+))?\s*=>/);
    const methodMatch = currentClass
      ? line.match(/^\s*(?:public|private|protected|static|async)*\s*([A-Za-z0-9_]+)\s*(?:<.*?>)?\s*\((.*?)\)(?:\s*:\s*([^{]+))?\s*\{?/)
      : null;

    let isFunc = false;
    let funcName = '';
    let isAsync = line.includes('async ');
    let isGenerator = line.includes('function*') || line.includes('yield ');
    let paramsRaw = '';
    let returnType: string | undefined = undefined;
    let isMethod = false;

    if (funcMatch && funcMatch[1]) {
      isFunc = true;
      funcName = funcMatch[1];
      paramsRaw = funcMatch[2] || '';
      returnType = funcMatch[3]?.trim();
    } else if (arrowMatch) {
      isFunc = true;
      funcName = arrowMatch[1];
      paramsRaw = arrowMatch[2] || arrowMatch[3] || '';
      returnType = arrowMatch[4]?.trim();
    } else if (methodMatch && methodMatch[1] && !['if', 'for', 'while', 'switch', 'catch'].includes(methodMatch[1])) {
      isFunc = true;
      isMethod = true;
      funcName = methodMatch[1];
      paramsRaw = methodMatch[2] || '';
      returnType = methodMatch[3]?.trim();
    }

    if (isFunc && funcName) {
      const params = paramsRaw.split(',').map(p => p.trim()).filter(Boolean);
      const symbolId = isMethod && currentClass ? `${currentClass}.${funcName}` : funcName;

      let endLine = lineNum;
      const bodyLines: string[] = [];
      let depth = 0;
      let started = false;

      for (let j = i; j < lines.length; j++) {
        const cur = lines[j];
        bodyLines.push(cur);
        for (const char of cur) {
          if (char === '{') {
            depth++;
            started = true;
          } else if (char === '}') {
            depth--;
          }
        }
        if (started && depth <= 0) {
          endLine = j + 1;
          break;
        }
        endLine = j + 1;
      }

      const bodyCode = bodyLines.join('\n');
      const tags: PatternTag[] = [];
      if (isAsync || /await\s+/.test(bodyCode)) tags.push('async');
      if (isGenerator) tags.push('generator');

      if (/fetch\(|axios\.|useQuery|useMutation|WebSocket|new Request\(|http:\/\//.test(bodyCode)) {
        tags.push('net');
      }

      if (/fs\.|readFile|writeFile|localStorage|sessionStorage|indexedDB|FileReader/.test(bodyCode)) {
        tags.push('io');
      }

      if (new RegExp(`\\b${funcName}\\s*\\(`).test(bodyCode)) {
        tags.push('recursive');
      }

      if (/useMemo\(|useCallback\(/.test(bodyCode)) {
        tags.push('memoized');
      }

      rawFuncs.push({
        id: symbolId,
        name: isMethod && currentClass ? `${currentClass}.${funcName}` : funcName,
        kind: isMethod ? 'method' : 'function',
        parentName: isMethod && currentClass ? currentClass : undefined,
        startLine: lineNum,
        endLine,
        params,
        returnType,
        docstring: accumulatedJSDoc,
        isExported: trimmed.startsWith('export'),
        tags,
        bodyCode,
        calls: []
      });

      accumulatedJSDoc = undefined;
    }
  }

  // 呼び出し関係の解決
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
      const curLineNum = caller.startLine + idx;

      for (const [shortName, fullNames] of shortNamesToFull.entries()) {
        const callRegex = new RegExp(`(?:this\\.|\\b)${shortName}\\s*\\(`, 'g');
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
      isExported: caller.isExported,
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
