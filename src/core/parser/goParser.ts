import { SymbolNode, CallEdge, PatternTag, ImportEntry } from '../../types';

interface RawGoFunc {
  id: string;
  name: string;
  kind: 'function' | 'method';
  parentName?: string;
  startLine: number;
  endLine: number;
  params: string[];
  returnType?: string;
  docstring?: string;
  tags: PatternTag[];
  bodyCode: string;
  calls: string[];
}

export function parseGoCode(code: string): {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  imports: ImportEntry[];
} {
  const lines = code.split('\n');
  const symbols: SymbolNode[] = [];
  const rawFuncs: RawGoFunc[] = [];
  const imports: ImportEntry[] = [];

  let accumulatedDoc: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Doc コメント
    if (trimmed.startsWith('//')) {
      const doc = trimmed.replace(/^\/\/\s*/, '');
      accumulatedDoc = accumulatedDoc ? `${accumulatedDoc} ${doc}` : doc;
      continue;
    }

    // import の抽出 (import "fmt", import ( "net/http" ... ))
    if (trimmed.startsWith('import (')) {
      for (let k = i + 1; k < lines.length; k++) {
        const impLine = lines[k].trim();
        if (impLine === ')') {
          i = k;
          break;
        }
        const pkgMatch = impLine.match(/["']([^'"]+)["']/);
        if (pkgMatch) {
          const pkg = pkgMatch[1];
          imports.push({
            source: pkg,
            symbols: [pkg.split('/').pop() || pkg],
            isStandardLib: !pkg.includes('.'),
            line: k + 1
          });
        }
      }
      continue;
    } else if (trimmed.startsWith('import ')) {
      const pkgMatch = trimmed.match(/import\s+["']([^'"]+)["']/);
      if (pkgMatch) {
        const pkg = pkgMatch[1];
        imports.push({
          source: pkg,
          symbols: [pkg.split('/').pop() || pkg],
          isStandardLib: !pkg.includes('.'),
          line: lineNum
        });
      }
      continue;
    }

    // Struct / Interface
    const typeMatch = line.match(/^type\s+([A-Za-z0-9_]+)\s+(struct|interface)/);
    if (typeMatch) {
      symbols.push({
        id: `type-${typeMatch[1]}`,
        name: typeMatch[1],
        kind: typeMatch[2] === 'struct' ? 'struct' : 'interface',
        startLine: lineNum,
        endLine: lineNum,
        docstring: accumulatedDoc,
        tags: [],
        calls: []
      });
      accumulatedDoc = undefined;
      continue;
    }

    // Function / Method
    const methodMatch = line.match(/^func\s+\((?:.*?\s+)?\*?([A-Za-z0-9_]+)\)\s+([A-Za-z0-9_]+)\s*\((.*?)\)(?:\s*(.*?))?\s*\{/);
    const funcMatch = line.match(/^func\s+([A-Za-z0-9_]+)\s*\((.*?)\)(?:\s*(.*?))?\s*\{/);

    let isFunc = false;
    let funcName = '';
    let receiverName: string | undefined = undefined;
    let paramsRaw = '';
    let returnType: string | undefined = undefined;

    if (methodMatch) {
      isFunc = true;
      receiverName = methodMatch[1];
      funcName = methodMatch[2];
      paramsRaw = methodMatch[3];
      returnType = methodMatch[4]?.trim();
    } else if (funcMatch) {
      isFunc = true;
      funcName = funcMatch[1];
      paramsRaw = funcMatch[2];
      returnType = funcMatch[3]?.trim();
    }

    if (isFunc && funcName) {
      const params = paramsRaw.split(',').map(p => p.trim()).filter(Boolean);
      const symbolId = receiverName ? `${receiverName}.${funcName}` : funcName;

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
      if (/go\s+func|go\s+[A-Za-z0-9_]+/.test(bodyCode)) tags.push('async');

      if (/os\.Open|os\.ReadFile|io\.|bufio|http\.Get|http\.Post|net\.Dial|http\.HandleFunc/.test(bodyCode)) {
        tags.push(/http\.|net\./.test(bodyCode) ? 'net' : 'io');
      }

      if (new RegExp(`\\b${funcName}\\s*\\(`).test(bodyCode)) {
        tags.push('recursive');
      }

      rawFuncs.push({
        id: symbolId,
        name: receiverName ? `${receiverName}.${funcName}` : funcName,
        kind: receiverName ? 'method' : 'function',
        parentName: receiverName,
        startLine: lineNum,
        endLine,
        params,
        returnType,
        docstring: accumulatedDoc,
        tags,
        bodyCode,
        calls: []
      });

      accumulatedDoc = undefined;
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
        const callRegex = new RegExp(`(?:\\b)${shortName}\\s*\\(`, 'g');
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
      tags: caller.tags,
      calls: caller.calls
    });
  }

  return {
    symbols: symbols.sort((a, b) => a.startLine - b.startLine),
    callEdges: Array.from(callEdgesMap.values()),
    imports
  };
}
