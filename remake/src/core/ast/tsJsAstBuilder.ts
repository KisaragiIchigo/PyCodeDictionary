import { ASTNode } from '../../types/ast';

export function buildTsJsAST(code: string): ASTNode {
  const lines = code.split('\n');
  const rootNode: ASTNode = {
    id: 'ts-ast-root',
    type: 'Program',
    label: 'Program (TS/JS AST Root)',
    category: 'module',
    loc: {
      start: { line: 1, column: 0 },
      end: { line: lines.length, column: lines[lines.length - 1]?.length || 0 }
    },
    attributes: {
      sourceType: 'module',
      linesCount: lines.length
    },
    children: []
  };

  interface BlockContext {
    bracketDepth: number;
    node: ASTNode;
  }

  let currentBracketDepth = 0;
  const stack: BlockContext[] = [{ bracketDepth: 0, node: rootNode }];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      continue;
    }

    const openBrackets = (rawLine.match(/{/g) || []).length;
    const closeBrackets = (rawLine.match(/}/g) || []).length;

    // 閉じる波括弧に応じたスタック巻き戻し
    if (closeBrackets > 0) {
      currentBracketDepth -= closeBrackets;
      while (stack.length > 1 && stack[stack.length - 1].bracketDepth > currentBracketDepth) {
        stack.pop();
      }
    }

    const currentParent = stack[stack.length - 1].node;

    // 1. 関数定義 (FunctionDeclaration / ArrowFunction)
    const funcMatch = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s*([a-zA-Z_$]\w*)?\s*\((.*?)\)(?:\s*:\s*(.*?))?\s*{?/);
    const arrowMatch = trimmed.match(/(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$]\w*)\s*=\s*(?:async\s*)?\((.*?)\)(?:\s*:\s*(.*?))?\s*=>/);

    if (funcMatch || arrowMatch) {
      const isArrow = !!arrowMatch;
      const name = isArrow ? arrowMatch![1] : (funcMatch![1] || 'anonymous');
      const paramsStr = isArrow ? arrowMatch![2] : funcMatch![2];
      const returnType = isArrow ? arrowMatch![3] : funcMatch![3];

      const params = paramsStr
        ? paramsStr.split(',').map(p => p.trim()).filter(Boolean)
        : [];

      const node: ASTNode = {
        id: `ts-ast-${lineNum}-${name}`,
        type: isArrow ? 'ArrowFunctionExpression' : 'FunctionDeclaration',
        label: `${isArrow ? 'ArrowFunction' : 'FunctionDeclaration'}: ${name}()`,
        category: 'declaration',
        loc: {
          start: { line: lineNum, column: 0 },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          name,
          async: trimmed.includes('async '),
          params,
          returnType: returnType?.replace(/{$/, '').trim() || null
        },
        children: []
      };

      currentParent.children.push(node);

      if (openBrackets > closeBrackets) {
        currentBracketDepth += (openBrackets - closeBrackets);
        stack.push({ bracketDepth: currentBracketDepth, node });
      }
      continue;
    }

    // 2. クラス / インターフェース / 型定義 (ClassDeclaration / InterfaceDeclaration / TypeAlias)
    const classMatch = trimmed.match(/(?:export\s+)?class\s+([a-zA-Z_$]\w*)(?:\s+extends\s+([a-zA-Z_$]\w*))?/);
    const ifaceMatch = trimmed.match(/(?:export\s+)?interface\s+([a-zA-Z_$]\w*)/);
    const typeMatch = trimmed.match(/(?:export\s+)?type\s+([a-zA-Z_$]\w*)\s*=/);

    if (classMatch || ifaceMatch || typeMatch) {
      const type = classMatch ? 'ClassDeclaration' : ifaceMatch ? 'TSInterfaceDeclaration' : 'TSTypeAliasDeclaration';
      const name = classMatch ? classMatch[1] : ifaceMatch ? ifaceMatch[1] : typeMatch![1];

      const node: ASTNode = {
        id: `ts-ast-${lineNum}-${name}`,
        type,
        label: `${type}: ${name}`,
        category: 'declaration',
        loc: {
          start: { line: lineNum, column: 0 },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          name,
          extends: classMatch ? classMatch[2] || null : null
        },
        children: []
      };

      currentParent.children.push(node);

      if (openBrackets > closeBrackets) {
        currentBracketDepth += (openBrackets - closeBrackets);
        stack.push({ bracketDepth: currentBracketDepth, node });
      }
      continue;
    }

    // 3. インポート (ImportDeclaration)
    if (trimmed.startsWith('import ') || trimmed.startsWith('import{')) {
      const node: ASTNode = {
        id: `ts-ast-${lineNum}-import`,
        type: 'ImportDeclaration',
        label: `ImportDeclaration: ${trimmed.slice(0, 40)}`,
        category: 'statement',
        loc: {
          start: { line: lineNum, column: 0 },
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

    // 4. 制御構文 (IfStatement, ForStatement, WhileStatement, TryStatement, SwitchStatement)
    const controlMatch = trimmed.match(/^(if|for|while|try|catch|switch)\b/);
    if (controlMatch) {
      const kw = controlMatch[1];
      const type =
        kw === 'if'
          ? 'IfStatement'
          : kw === 'for'
          ? 'ForStatement'
          : kw === 'while'
          ? 'WhileStatement'
          : kw === 'try' || kw === 'catch'
          ? 'TryStatement'
          : 'SwitchStatement';

      const node: ASTNode = {
        id: `ts-ast-${lineNum}-${kw}`,
        type,
        label: `${type} (${trimmed.slice(0, 30)})`,
        category: 'statement',
        loc: {
          start: { line: lineNum, column: 0 },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          keyword: kw,
          snippet: trimmed
        },
        children: []
      };

      currentParent.children.push(node);

      if (openBrackets > closeBrackets) {
        currentBracketDepth += (openBrackets - closeBrackets);
        stack.push({ bracketDepth: currentBracketDepth, node });
      }
      continue;
    }

    // 5. 変数宣言 (VariableDeclaration)
    const varMatch = trimmed.match(/(?:export\s+)?(const|let|var)\s+([a-zA-Z_$]\w*)\s*(?::\s*.*?)?\s*=\s*(.*)/);
    if (varMatch) {
      const kind = varMatch[1];
      const name = varMatch[2];
      const val = varMatch[3];

      const node: ASTNode = {
        id: `ts-ast-${lineNum}-var`,
        type: 'VariableDeclaration',
        label: `VariableDeclaration (${kind}): ${name}`,
        category: 'declaration',
        loc: {
          start: { line: lineNum, column: 0 },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          kind,
          name,
          valuePreview: val.slice(0, 30)
        },
        children: []
      };
      currentParent.children.push(node);

      if (openBrackets > closeBrackets) {
        currentBracketDepth += (openBrackets - closeBrackets);
        stack.push({ bracketDepth: currentBracketDepth, node });
      }
      continue;
    }

    // 6. 関数呼び出し (CallExpression)
    const callMatch = trimmed.match(/^([a-zA-Z_$]\w*(?:\.[a-zA-Z_$]\w*)*)\((.*?)\)/);
    if (callMatch) {
      const callee = callMatch[1];
      const node: ASTNode = {
        id: `ts-ast-${lineNum}-call`,
        type: 'CallExpression',
        label: `CallExpression: ${callee}()`,
        category: 'expression',
        loc: {
          start: { line: lineNum, column: 0 },
          end: { line: lineNum, column: rawLine.length }
        },
        attributes: {
          callee,
          args: callMatch[2]
        },
        children: []
      };
      currentParent.children.push(node);
      continue;
    }

    // 7. リターン文 (ReturnStatement)
    if (trimmed.startsWith('return\b') || trimmed.startsWith('return ') || trimmed === 'return;') {
      const node: ASTNode = {
        id: `ts-ast-${lineNum}-return`,
        type: 'ReturnStatement',
        label: `ReturnStatement: ${trimmed.slice(0, 30)}`,
        category: 'statement',
        loc: {
          start: { line: lineNum, column: 0 },
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

    // 8. 一般文 (ExpressionStatement / Statement)
    const node: ASTNode = {
      id: `ts-ast-${lineNum}-stmt`,
      type: 'ExpressionStatement',
      label: `Statement: ${trimmed.slice(0, 35)}`,
      category: 'statement',
      loc: {
        start: { line: lineNum, column: 0 },
        end: { line: lineNum, column: rawLine.length }
      },
      attributes: {
        raw: trimmed
      },
      children: []
    };
    currentParent.children.push(node);

    if (openBrackets > closeBrackets) {
      currentBracketDepth += (openBrackets - closeBrackets);
      stack.push({ bracketDepth: currentBracketDepth, node });
    }
  }

  return rootNode;
}
