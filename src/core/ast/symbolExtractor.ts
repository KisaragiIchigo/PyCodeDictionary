import type { Node as NodeType } from 'web-tree-sitter';
import { SymbolNode, CallEdge, PatternTag, ImportEntry, SupportedLanguage } from '../../types';

// 言語別 Tree-sitter 構文抽出ロジック
export class SymbolExtractor {
  public static extract(
    root: NodeType,
    code: string,
    _language: SupportedLanguage
  ): {
    symbols: SymbolNode[];
    callEdges: CallEdge[];
    imports: ImportEntry[];
  } {
    const symbols: SymbolNode[] = [];
    const imports: ImportEntry[] = [];
    const rawCalls: { caller: string; target: string; line: number }[] = [];

    // ASTノードの厳密トラバース
    const visit = (node: NodeType, currentClass: string | null = null, currentFunction: string | null = null) => {
      const type = node.type;
      const startLine = node.startPosition.row + 1;
      const endLine = node.endPosition.row + 1;

      // 1. インポートの抽出 (import_statement, import_from_statement, use_declaration, import_declaration, preproc_include)
      if (
        type === 'import_statement' ||
        type === 'import_from_statement' ||
        type === 'use_declaration' ||
        type === 'import_declaration' ||
        type === 'preproc_include'
      ) {
        const importText = code.slice(node.startIndex, node.endIndex).trim();
        imports.push({
          source: importText.slice(0, 50),
          symbols: [importText.slice(0, 35)],
          isStandardLib: !importText.startsWith('.') && !importText.startsWith('/'),
          line: startLine
        });
        return;
      }

      // 2. クラス / 構造体 / インターフェース / トレイトの抽出
      if (
        type === 'class_definition' ||
        type === 'class_declaration' ||
        type === 'class_specifier' ||
        type === 'struct_item' ||
        type === 'struct_specifier' ||
        type === 'type_declaration' ||
        type === 'trait_item' ||
        type === 'interface_declaration'
      ) {
        const nameNode = node.childForFieldName('name') || node.children.find((c: NodeType) => c.type.includes('identifier'));
        const name = nameNode ? code.slice(nameNode.startIndex, nameNode.endIndex) : 'Class';
        const kind = type.includes('struct') ? 'struct' : type.includes('trait') || type.includes('interface') ? 'interface' : 'class';

        // 継承・基底クラスの取得
        const superNode = node.childForFieldName('superclasses') || node.childForFieldName('bases') || node.childForFieldName('heritage');
        const extendsClasses = superNode ? [code.slice(superNode.startIndex, superNode.endIndex)] : [];

        symbols.push({
          id: `class-${name}`,
          name,
          kind,
          startLine,
          endLine,
          extendsClasses,
          tags: [],
          calls: []
        });

        for (let i = 0; i < node.namedChildCount; i++) {
          visit(node.namedChild(i)!, name, currentFunction);
        }
        return;
      }

      // 3. 関数 / メソッド定義の抽出
      if (
        type === 'function_definition' ||
        type === 'function_declaration' ||
        type === 'function_item' ||
        type === 'method_definition' ||
        type === 'method_declaration' ||
        type === 'arrow_function'
      ) {
        const nameNode = node.childForFieldName('name') || node.children.find((c: NodeType) => c.type === 'identifier' || c.type === 'field_identifier');
        let funcName = nameNode ? code.slice(nameNode.startIndex, nameNode.endIndex) : '';

        if (!funcName && type === 'arrow_function') {
          const parentDecl = node.parent;
          if (parentDecl && parentDecl.childForFieldName('name')) {
            const pName = parentDecl.childForFieldName('name')!;
            funcName = code.slice(pName.startIndex, pName.endIndex);
          }
        }

        if (funcName) {
          const isMethod = currentClass !== null;
          const fullName = isMethod ? `${currentClass}.${funcName}` : funcName;

          const paramsNode = node.childForFieldName('parameters') || node.childForFieldName('params');
          const params: string[] = [];
          if (paramsNode) {
            for (let p = 0; p < paramsNode.namedChildCount; p++) {
              const pChild = paramsNode.namedChild(p)!;
              params.push(code.slice(pChild.startIndex, pChild.endIndex));
            }
          }

          const returnTypeNode = node.childForFieldName('return_type') || node.childForFieldName('result');
          const returnType = returnTypeNode ? code.slice(returnTypeNode.startIndex, returnTypeNode.endIndex) : undefined;

          const tags: PatternTag[] = [];
          const bodyText = code.slice(node.startIndex, node.endIndex);
          if (bodyText.includes('async ') || bodyText.includes('await ')) tags.push('async');
          if (bodyText.includes('yield ') || bodyText.includes('yield*')) tags.push('generator');
          if (/fetch|axios|http|requests|reqwest|net\./.test(bodyText)) tags.push('net');
          if (/fs\.|open\(|File::|read_to_string|os\.ReadFile|std::ifstream/.test(bodyText)) tags.push('io');
          if (new RegExp(`\\b${funcName}\\s*\\(`).test(bodyText)) tags.push('recursive');

          symbols.push({
            id: fullName,
            name: fullName,
            kind: isMethod ? 'method' : 'function',
            parentName: currentClass || undefined,
            startLine,
            endLine,
            parameters: params,
            returnType,
            tags,
            calls: []
          });

          for (let i = 0; i < node.namedChildCount; i++) {
            visit(node.namedChild(i)!, currentClass, fullName);
          }
          return;
        }
      }

      // 4. 関数呼び出し (CallExpression / Call / MethodInvocation)
      if (type === 'call_expression' || type === 'call' || type === 'method_invocation') {
        const funcNode = node.childForFieldName('function') || node.children[0];
        if (funcNode) {
          let calleeName = code.slice(funcNode.startIndex, funcNode.endIndex);
          if (calleeName.includes('.')) calleeName = calleeName.split('.').pop()!;
          if (calleeName.includes('::')) calleeName = calleeName.split('::').pop()!;

          if (currentFunction) {
            rawCalls.push({
              caller: currentFunction,
              target: calleeName,
              line: startLine
            });
          }
        }
      }

      for (let i = 0; i < node.namedChildCount; i++) {
        visit(node.namedChild(i)!, currentClass, currentFunction);
      }
    };

    visit(root);

    // 呼び出しグラフの解決
    const callEdgesMap = new Map<string, CallEdge>();
    for (const call of rawCalls) {
      const callerSym = symbols.find(s => s.name === call.caller || s.name.endsWith(`.${call.caller}`));
      let targetSym = symbols.find(s => s.name === call.target || s.name.endsWith(`.${call.target}`) || s.name.endsWith(`::${call.target}`));

      if (targetSym) {
        const callerName = callerSym ? callerSym.name : call.caller;
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

    return {
      symbols: symbols.sort((a, b) => a.startLine - b.startLine),
      callEdges: Array.from(callEdgesMap.values()),
      imports
    };
  }
}
