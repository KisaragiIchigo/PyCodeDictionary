import { SymbolNode, CallEdge, PatternTag, ImportEntry } from '../../types';

interface RawCppFunc {
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

export function parseCppCode(code: string): {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  imports: ImportEntry[];
} {
  const lines = code.split('\n');
  const symbols: SymbolNode[] = [];
  const rawFuncs: RawCppFunc[] = [];
  const imports: ImportEntry[] = [];

  let currentClass: string | null = null;
  let currentNamespace: string | null = null;
  let accumulatedDoc: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    if (!trimmed) continue;

    // コメント (// ... または /* ... */)
    if (trimmed.startsWith('//')) {
      const doc = trimmed.replace(/^\/\/\s*/, '');
      accumulatedDoc = accumulatedDoc ? `${accumulatedDoc} ${doc}` : doc;
      continue;
    }

    // #include の抽出 (#include <iostream>, #include "my_header.h")
    const incMatch = trimmed.match(/^#include\s+([<"][^>"]+[>"])/);
    if (incMatch) {
      const header = incMatch[1];
      const isStd = header.startsWith('<');
      const cleanHeader = header.replace(/[<>"]/g, '');
      imports.push({
        source: cleanHeader,
        symbols: [cleanHeader.split('/').pop() || cleanHeader],
        isStandardLib: isStd,
        line: lineNum
      });
      continue;
    }

    // namespace
    const nsMatch = trimmed.match(/^namespace\s+([A-Za-z0-9_]+)/);
    if (nsMatch) {
      currentNamespace = nsMatch[1];
    }

    // Class / Struct
    const classMatch = trimmed.match(/^(?:template\s*<.*?>\s*)?(?:class|struct)\s+([A-Za-z0-9_]+)(?:\s*:\s*(?:public|private|protected)\s+([A-Za-z0-9_]+))?/);
    if (classMatch && !trimmed.endsWith(';')) {
      const className = classMatch[1];
      const baseClass = classMatch[2];
      currentClass = className;

      symbols.push({
        id: `class-${className}`,
        name: currentNamespace ? `${currentNamespace}::${className}` : className,
        kind: 'class',
        startLine: lineNum,
        endLine: lineNum,
        docstring: accumulatedDoc,
        extendsClasses: baseClass ? [baseClass] : [],
        tags: [],
        calls: []
      });
      accumulatedDoc = undefined;
      continue;
    }

    // Function / Method (auto my_func(...) -> void, void MyClass::method(...), int func(...))
    const fnMatch = line.match(/(?:template\s*<.*?>\s*)?(?:(?:static|inline|virtual|explicit|friend|const|constexpr)\s+)*([A-Za-z0-9_:<>&*]+)\s+([A-Za-z0-9_:]+)\s*\((.*?)\)(?:\s*const)?(?:\s*noexcept)?(?:\s*override)?(?:\s*->\s*[^{;]+)?\s*\{/);
    if (fnMatch) {
      const returnType = fnMatch[1];
      const fullFnName = fnMatch[2];
      const paramsRaw = fnMatch[3];

      if (['if', 'for', 'while', 'switch', 'catch'].includes(fullFnName)) {
        continue;
      }

      const isMethod = fullFnName.includes('::') || currentClass !== null;
      const fnName = fullFnName;
      const params = paramsRaw.split(',').map(p => p.trim()).filter(Boolean);
      const symbolId = fnName;

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
      if (/std::async|std::thread|std::future|pthread_create/.test(bodyCode)) tags.push('async');

      if (/std::ifstream|std::ofstream|std::fstream|std::cout|printf|fopen|socket|curl|boost::asio/.test(bodyCode)) {
        tags.push(/socket|curl|boost::asio|http/.test(bodyCode) ? 'net' : 'io');
      }

      const baseName = fnName.includes('::') ? fnName.split('::').pop()! : fnName;
      if (new RegExp(`\\b${baseName}\\s*\\(`).test(bodyCode)) {
        tags.push('recursive');
      }

      rawFuncs.push({
        id: symbolId,
        name: fnName,
        kind: isMethod ? 'method' : 'function',
        parentName: fullFnName.includes('::') ? fullFnName.split('::')[0] : (currentClass || undefined),
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
    const short = f.name.includes('::') ? f.name.split('::').pop()! : f.name;
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
        const callRegex = new RegExp(`(?:this->|\\b)${shortName}\\s*\\(`, 'g');
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
