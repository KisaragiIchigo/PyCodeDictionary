import { ASTNode } from '../../types/ast';

export function buildPythonAST(code: string): ASTNode {
  const lines = code.split('\n');
  const rootNode: ASTNode = {
    id: 'ast-root',
    type: 'Module',
    label: 'Module (Python AST Root)',
    category: 'module',
    loc: {
      start: { line: 1, column: 0 },
      end: { line: lines.length, column: lines[lines.length - 1]?.length || 0 }
    },
    attributes: {
      bodyLength: lines.length,
      docstring: null
    },
    children: []
  };

  interface BlockContext {
    indent: number;
    node: ASTNode;
  }

  const stack: BlockContext[] = [{ indent: -1, node: rootNode }];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const indent = rawLine.search(/\S/);

    // インデントに応じたスタックの巻き戻し
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const currentParent = stack[stack.length - 1].node;

    // 1. 関数の定義 (FunctionDef / AsyncFunctionDef)
    const funcMatch = trimmed.match(/^(async\s+)?def\s+([a-zA-Z_]\w*)\s*\((.*?)\)(?:\s*->\s*(.*?))?:/);
    if (funcMatch) {
      const isAsync = !!funcMatch[1];
      const name = funcMatch[2];
      const paramsStr = funcMatch[3];
      const returnType = funcMatch[4]?.trim();

      const params = paramsStr
        ? paramsStr.split(',').map(p => p.trim()).filter(Boolean)
        : [];

      const node: ASTNode = {
        id: `py-ast-${lineNum}-${name}`,
        type: isAsync ? 'AsyncFunctionDef' : 'FunctionDef',
        label: `${isAsync ? 'AsyncFunctionDef' : 'FunctionDef'}: ${name}`,
        category: 'declaration',
        loc: {
          start: { line: lineNum, column: indent },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          name,
          async: isAsync,
          params,
          returnType: returnType || null
        },
        children: []
      };

      currentParent.children.push(node);
      stack.push({ indent, node });
      continue;
    }

    // 2. クラスの定義 (ClassDef)
    const classMatch = trimmed.match(/^class\s+([a-zA-Z_]\w*)(?:\((.*?)\))?:/);
    if (classMatch) {
      const name = classMatch[1];
      const bases = classMatch[2] ? classMatch[2].split(',').map(b => b.trim()).filter(Boolean) : [];

      const node: ASTNode = {
        id: `py-ast-${lineNum}-${name}`,
        type: 'ClassDef',
        label: `ClassDef: ${name}`,
        category: 'declaration',
        loc: {
          start: { line: lineNum, column: indent },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          name,
          bases
        },
        children: []
      };

      currentParent.children.push(node);
      stack.push({ indent, node });
      continue;
    }

    // 3. インポート (Import / ImportFrom)
    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      const isFrom = trimmed.startsWith('from ');
      const node: ASTNode = {
        id: `py-ast-${lineNum}-import`,
        type: isFrom ? 'ImportFrom' : 'Import',
        label: isFrom ? `ImportFrom: ${trimmed}` : `Import: ${trimmed}`,
        category: 'statement',
        loc: {
          start: { line: lineNum, column: indent },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          statement: trimmed
        },
        children: []
      };
      currentParent.children.push(node);
      continue;
    }

    // 4. 制御構文 (If, For, While, Try, With)
    const controlMatch = trimmed.match(/^(if|elif|else|for|while|try|except|finally|with)\b/);
    if (controlMatch) {
      const keyword = controlMatch[1];
      const nodeType =
        keyword === 'if' || keyword === 'elif' || keyword === 'else'
          ? 'IfStatement'
          : keyword === 'for'
          ? 'ForStatement'
          : keyword === 'while'
          ? 'WhileStatement'
          : keyword === 'try' || keyword === 'except' || keyword === 'finally'
          ? 'TryStatement'
          : 'WithStatement';

      const node: ASTNode = {
        id: `py-ast-${lineNum}-${keyword}`,
        type: nodeType,
        label: `${nodeType} (${trimmed.replace(/:$/, '')})`,
        category: 'statement',
        loc: {
          start: { line: lineNum, column: indent },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          keyword,
          condition: trimmed
        },
        children: []
      };

      currentParent.children.push(node);
      if (trimmed.endsWith(':')) {
        stack.push({ indent, node });
      }
      continue;
    }

    // 5. 代入文 (Assign / AnnAssign)
    const assignMatch = trimmed.match(/^([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*(?::\s*([a-zA-Z_]\w*))?\s*=\s*(.*)/);
    if (assignMatch) {
      const target = assignMatch[1];
      const typeAnn = assignMatch[2];
      const value = assignMatch[3];

      const node: ASTNode = {
        id: `py-ast-${lineNum}-assign`,
        type: typeAnn ? 'AnnAssign' : 'Assign',
        label: `Assign: ${target} = ${value.slice(0, 30)}`,
        category: 'statement',
        loc: {
          start: { line: lineNum, column: indent },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          target,
          typeAnnotation: typeAnn || null,
          valueSnippet: value
        },
        children: []
      };
      currentParent.children.push(node);
      continue;
    }

    // 6. 関数呼び出し・式文 (Expr / Call)
    const callMatch = trimmed.match(/^([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\((.*?)\)/);
    if (callMatch) {
      const callee = callMatch[1];
      const argsStr = callMatch[2];

      const node: ASTNode = {
        id: `py-ast-${lineNum}-call`,
        type: 'CallExpression',
        label: `Call: ${callee}()`,
        category: 'expression',
        loc: {
          start: { line: lineNum, column: indent },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          callee,
          args: argsStr
        },
        children: []
      };
      currentParent.children.push(node);
      continue;
    }

    // 7. リターン文 (Return)
    if (trimmed.startsWith('return\b') || trimmed === 'return') {
      const val = trimmed.replace(/^return\s*/, '');
      const node: ASTNode = {
        id: `py-ast-${lineNum}-return`,
        type: 'ReturnStatement',
        label: `Return: ${val || 'None'}`,
        category: 'statement',
        loc: {
          start: { line: lineNum, column: indent },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          value: val || null
        },
        children: []
      };
      currentParent.children.push(node);
      continue;
    }

    // 8. 一般的な文 (Statement)
    const node: ASTNode = {
      id: `py-ast-${lineNum}-stmt`,
      type: 'Statement',
      label: `Stmt: ${trimmed.slice(0, 35)}`,
      category: 'statement',
      loc: {
        start: { line: lineNum, column: indent },
        end: { line: lineNum, column: rawLine.length }
      },
      attributes: {
        raw: trimmed
      },
      children: []
    };
    currentParent.children.push(node);
  }

  return rootNode;
}
