import { parse } from '@babel/parser';
import { SymbolNode, CallEdge, PatternTag, ImportEntry } from '../../types';

export function parseTsJsCode(code: string): {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  imports: ImportEntry[];
} {
  const symbols: SymbolNode[] = [];
  const imports: ImportEntry[] = [];
  const callEdgesMap = new Map<string, CallEdge>();

  try {
    const plugins: any[] = [
      'typescript',
      'jsx',
      ['decorators', { decoratorsBeforeExport: true }]
    ];

    const ast = parse(code, {
      sourceType: 'unambiguous',
      plugins,
      errorRecovery: true
    });

    const definedFunctions = new Map<string, { startLine: number; endLine: number; node: any }>();
    const funcCalls = new Map<string, { target: string; line: number }[]>();

    const traverse = (node: any, currentClass: string | null = null, currentFunction: string | null = null) => {
      if (!node || typeof node !== 'object') return;

      const line = node.loc ? node.loc.start.line : 1;
      const endLine = node.loc ? node.loc.end.line : line;

      if (node.type === 'ImportDeclaration') {
        const source = node.source?.value || '';
        const importedSymbols: string[] = [];
        if (node.specifiers) {
          for (const spec of node.specifiers) {
            if (spec.imported?.name) importedSymbols.push(spec.imported.name);
            else if (spec.local?.name) importedSymbols.push(spec.local.name);
          }
        }
        imports.push({
          source,
          symbols: importedSymbols,
          isStandardLib: !source.startsWith('.') && !source.startsWith('/'),
          line
        });
        return;
      }

      if (node.type === 'ClassDeclaration' && node.id?.name) {
        const className = node.id.name;
        const extendsClass = node.superClass?.name;
        symbols.push({
          id: `class-${className}`,
          name: className,
          kind: 'class',
          startLine: line,
          endLine,
          extendsClasses: extendsClass ? [extendsClass] : [],
          tags: [],
          calls: []
        });

        if (node.body?.body) {
          for (const member of node.body.body) {
            traverse(member, className, currentFunction);
          }
        }
        return;
      }

      let funcName: string | null = null;
      let isMethod = false;
      let isAsync = !!node.async;
      let isGenerator = !!node.generator;
      let params: string[] = [];

      if (node.type === 'FunctionDeclaration' && node.id?.name) {
        funcName = node.id.name;
      } else if (node.type === 'ClassMethod' && node.key?.name) {
        funcName = currentClass ? `${currentClass}.${node.key.name}` : node.key.name;
        isMethod = true;
      } else if (node.type === 'VariableDeclarator' && node.id?.name && (node.init?.type === 'ArrowFunctionExpression' || node.init?.type === 'FunctionExpression')) {
        funcName = node.id.name;
        isAsync = !!node.init.async;
        isGenerator = !!node.init.generator;
        node = node.init;
      }

      if (funcName) {
        if (node.params) {
          params = node.params.map((p: any) => p.name || (p.left?.name) || 'param');
        }

        const tags: PatternTag[] = [];
        if (isAsync) tags.push('async');
        if (isGenerator) tags.push('generator');

        const funcKey = funcName;
        definedFunctions.set(funcKey, { startLine: line, endLine, node });
        funcCalls.set(funcKey, []);

        const inspectBody = (subNode: any) => {
          if (!subNode || typeof subNode !== 'object') return;

          if (subNode.type === 'CallExpression') {
            let calleeName: string | null = null;
            if (subNode.callee?.name) {
              calleeName = subNode.callee.name;
            } else if (subNode.callee?.property?.name) {
              calleeName = subNode.callee.property.name;
            }

            if (calleeName) {
              const callLine = subNode.loc ? subNode.loc.start.line : line;
              funcCalls.get(funcKey)?.push({ target: calleeName, line: callLine });

              if (calleeName === 'fetch' || calleeName === 'axios' || calleeName === 'useQuery') {
                if (!tags.includes('net')) tags.push('net');
              }
              if (calleeName.startsWith('read') || calleeName.startsWith('write') || calleeName === 'readFile') {
                if (!tags.includes('io')) tags.push('io');
              }
              if (calleeName === funcName || calleeName === funcName.split('.').pop()) {
                if (!tags.includes('recursive')) tags.push('recursive');
              }
            }
          }

          for (const k of Object.keys(subNode)) {
            if (k === 'loc' || k === 'start' || k === 'end') continue;
            const child = subNode[k];
            if (Array.isArray(child)) {
              for (const c of child) inspectBody(c);
            } else if (child && typeof child === 'object') {
              inspectBody(child);
            }
          }
        };

        if (node.body) inspectBody(node.body);

        symbols.push({
          id: funcKey,
          name: funcKey,
          kind: isMethod ? 'method' : 'function',
          parentName: currentClass || undefined,
          startLine: line,
          endLine,
          parameters: params,
          tags,
          calls: []
        });

        return;
      }

      for (const k of Object.keys(node)) {
        if (k === 'loc' || k === 'start' || k === 'end') continue;
        const child = node[k];
        if (Array.isArray(child)) {
          for (const c of child) traverse(c, currentClass, currentFunction);
        } else if (child && typeof child === 'object') {
          traverse(child, currentClass, currentFunction);
        }
      }
    };

    traverse(ast.program);

    for (const [callerName, calls] of funcCalls.entries()) {
      const callerSym = symbols.find(s => s.name === callerName);

      for (const call of calls) {
        let targetSym = symbols.find(s => s.name === call.target || s.name.endsWith(`.${call.target}`));
        if (targetSym) {
          if (callerSym && !callerSym.calls.includes(targetSym.name)) {
            callerSym.calls.push(targetSym.name);
          }

          const edgeKey = `${callerName}->${targetSym.name}`;
          if (!callEdgesMap.has(edgeKey)) {
            callEdgesMap.set(edgeKey, {
              id: `edge-${edgeKey}`,
              source: callerName,
              target: targetSym.name,
              sourceName: callerName,
              targetName: targetSym.name,
              count: 1,
              lines: [call.line]
            });
          } else {
            const edge = callEdgesMap.get(edgeKey)!;
            edge.count++;
            if (!edge.lines.includes(call.line)) edge.lines.push(call.line);
          }
        }
      }
    }
  } catch (err) {
    console.warn('AST parse failed in tsJsParser:', err);
  }

  return {
    symbols: symbols.sort((a, b) => a.startLine - b.startLine),
    callEdges: Array.from(callEdgesMap.values()),
    imports
  };
}
