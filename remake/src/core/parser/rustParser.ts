import { SymbolNode, CallEdge, PatternTag, ImportEntry } from '../../types';

interface RawRustFunc {
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

export function parseRustCode(code: string): {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  imports: ImportEntry[];
} {
  const lines = code.split('\n');
  const symbols: SymbolNode[] = [];
  const rawFuncs: RawRustFunc[] = [];
  const imports: ImportEntry[] = [];

  let currentImpl: string | null = null;
  let currentTrait: string | null = null;
  let accumulatedDoc: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Doc コメント (/// ...)
    if (trimmed.startsWith('///')) {
      const doc = trimmed.replace(/^\/\/\/\s*/, '');
      accumulatedDoc = accumulatedDoc ? `${accumulatedDoc} ${doc}` : doc;
      continue;
    }

    // use 文の抽出 (use std::fs::File; use crate::foo::bar;)
    const useMatch = trimmed.match(/^use\s+([A-Za-z0-9_:]+(?:\{.*?\})?);/);
    if (useMatch) {
      const source = useMatch[1];
      imports.push({
        source,
        symbols: [source.split('::').pop() || source],
        isStandardLib: source.startsWith('std::') || source.startsWith('core::') || source.startsWith('alloc::'),
        line: lineNum
      });
      continue;
    }

    // Trait 定義 (pub trait MyTrait { ... })
    const traitMatch = trimmed.match(/(?:pub\s+)?trait\s+([A-Za-z0-9_]+)/);
    if (traitMatch) {
      currentTrait = traitMatch[1];
      symbols.push({
        id: `trait-${traitMatch[1]}`,
        name: traitMatch[1],
        kind: 'interface',
        startLine: lineNum,
        endLine: lineNum,
        docstring: accumulatedDoc,
        tags: [],
        calls: []
      });
      accumulatedDoc = undefined;
      continue;
    }

    // Struct 定義 (pub struct MyStruct { ... })
    const structMatch = trimmed.match(/(?:pub\s+)?struct\s+([A-Za-z0-9_]+)/);
    if (structMatch) {
      symbols.push({
        id: `struct-${structMatch[1]}`,
        name: structMatch[1],
        kind: 'struct',
        startLine: lineNum,
        endLine: lineNum,
        docstring: accumulatedDoc,
        tags: [],
        calls: []
      });
      accumulatedDoc = undefined;
      continue;
    }

    // Enum 定義 (pub enum MyEnum { ... })
    const enumMatch = trimmed.match(/(?:pub\s+)?enum\s+([A-Za-z0-9_]+)/);
    if (enumMatch) {
      symbols.push({
        id: `enum-${enumMatch[1]}`,
        name: enumMatch[1],
        kind: 'enum',
        startLine: lineNum,
        endLine: lineNum,
        docstring: accumulatedDoc,
        tags: [],
        calls: []
      });
      accumulatedDoc = undefined;
      continue;
    }

    // Impl block (impl MyStruct or impl MyTrait for MyStruct)
    const implMatch = trimmed.match(/impl(?:<.*?>)?\s+(?:([A-Za-z0-9_]+)\s+for\s+)?([A-Za-z0-9_]+)/);
    if (implMatch) {
      currentImpl = implMatch[2];
    }

    // Function / Method (fn my_func<T>(...) -> ReturnType { ... })
    const fnMatch = line.match(/(?:pub(?:\(.*?\))?\s+)?(?:async\s+)?(?:unsafe\s+)?(?:extern(?:\s+".*?")?\s+)?fn\s+([A-Za-z0-9_]+)\s*(?:<.*?>)?\s*\((.*?)\)(?:\s*->\s*([^{;]+))?/);
    if (fnMatch) {
      const isAsync = line.includes('async fn');
      const isUnsafe = line.includes('unsafe fn');
      const fnName = fnMatch[1];
      const paramsRaw = fnMatch[2];
      const returnType = fnMatch[3]?.trim();
      const isMethod = currentImpl !== null && (paramsRaw.includes('self') || paramsRaw.includes('&self') || paramsRaw.includes('&mut self'));

      const params = paramsRaw.split(',').map(p => p.trim()).filter(Boolean);
      const symbolId = isMethod && currentImpl ? `${currentImpl}::${fnName}` : fnName;

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
      if (isAsync) tags.push('async');
      if (isUnsafe) tags.push('unsafe');

      if (/File::|std::fs|read_to_string|write_all|TcpStream|reqwest|tokio::fs|tokio::net/.test(bodyCode)) {
        tags.push(/reqwest|TcpStream|http|tokio::net/.test(bodyCode) ? 'net' : 'io');
      }

      if (new RegExp(`\\b${fnName}\\s*\\(`).test(bodyCode)) {
        tags.push('recursive');
      }

      rawFuncs.push({
        id: symbolId,
        name: isMethod && currentImpl ? `${currentImpl}::${fnName}` : fnName,
        kind: isMethod ? 'method' : 'function',
        parentName: isMethod && currentImpl ? currentImpl : undefined,
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
        const callRegex = new RegExp(`(?:self\\.|Self::|\\b)${shortName}\\s*\\(`, 'g');
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
