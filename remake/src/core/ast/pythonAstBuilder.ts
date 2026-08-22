import { ASTNode } from '../../types/ast';

// Python トークン型
type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'OPERATOR'
  | 'PUNCTUATION'
  | 'INDENT'
  | 'DEDENT'
  | 'NEWLINE'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// 1. Python レキサー (字句解析器)
class PythonLexer {
  private code: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 0;
  private indentStack: number[] = [0];
  private tokens: Token[] = [];

  private static KEYWORDS = new Set([
    'def', 'async', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except',
    'finally', 'with', 'return', 'yield', 'import', 'from', 'as', 'pass', 'break',
    'continue', 'lambda', 'assert', 'raise', 'match', 'case', 'global', 'nonlocal',
    'True', 'False', 'None', 'and', 'or', 'not', 'is', 'in'
  ]);

  constructor(code: string) {
    this.code = code;
  }

  public tokenize(): Token[] {
    const rawLines = this.code.split('\n');

    for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
      const lineStr = rawLines[lineIdx];
      this.line = lineIdx + 1;
      this.column = 0;

      // コメントまたは空行のスキップ
      const trimmed = lineStr.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // インデント計算
      const leadingSpaces = lineStr.search(/\S/);
      const currentIndent = leadingSpaces === -1 ? 0 : leadingSpaces;
      const prevIndent = this.indentStack[this.indentStack.length - 1];

      if (currentIndent > prevIndent) {
        this.indentStack.push(currentIndent);
        this.tokens.push({ type: 'INDENT', value: `${currentIndent}`, line: this.line, column: 0 });
      } else if (currentIndent < prevIndent) {
        while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > currentIndent) {
          this.indentStack.pop();
          this.tokens.push({ type: 'DEDENT', value: `${currentIndent}`, line: this.line, column: 0 });
        }
      }

      // 行内トークナイズ
      let i = currentIndent;
      while (i < lineStr.length) {
        const char = lineStr[i];
        this.column = i;

        // 空白スキップ
        if (char === ' ' || char === '\t') {
          i++;
          continue;
        }

        // コメント
        if (char === '#') {
          break;
        }

        // 文字列 (シングル/ダブル/トリプルクォート)
        if (char === '"' || char === "'") {
          const isTriple = lineStr.slice(i, i + 3) === char.repeat(3);
          const quote = isTriple ? char.repeat(3) : char;
          let strVal = '';
          const startCol = i;
          i += quote.length;

          while (i < lineStr.length && lineStr.slice(i, i + quote.length) !== quote) {
            strVal += lineStr[i];
            i++;
          }
          i += quote.length;

          this.tokens.push({ type: 'STRING', value: strVal, line: this.line, column: startCol });
          continue;
        }

        // 識別子 & キーワード
        if (/[a-zA-Z_]/.test(char)) {
          let ident = '';
          const startCol = i;
          while (i < lineStr.length && /[a-zA-Z0-9_]/.test(lineStr[i])) {
            ident += lineStr[i];
            i++;
          }

          if (PythonLexer.KEYWORDS.has(ident)) {
            this.tokens.push({ type: 'KEYWORD', value: ident, line: this.line, column: startCol });
          } else {
            this.tokens.push({ type: 'IDENTIFIER', value: ident, line: this.line, column: startCol });
          }
          continue;
        }

        // 数値
        if (/[0-9]/.test(char)) {
          let num = '';
          const startCol = i;
          while (i < lineStr.length && /[0-9.eE_]/.test(lineStr[i])) {
            num += lineStr[i];
            i++;
          }
          this.tokens.push({ type: 'NUMBER', value: num, line: this.line, column: startCol });
          continue;
        }

        // 2文字演算子 (->, ==, !=, <=, >=, +=, -=, etc.)
        const twoChar = lineStr.slice(i, i + 2);
        if (['->', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '//', '**'].includes(twoChar)) {
          this.tokens.push({ type: 'OPERATOR', value: twoChar, line: this.line, column: i });
          i += 2;
          continue;
        }

        // 1文字演算子 / 記号
        if (['(', ')', '[', ']', '{', '}', ':', ',', '.', '=', '+', '-', '*', '/', '%', '@'].includes(char)) {
          this.tokens.push({ type: 'PUNCTUATION', value: char, line: this.line, column: i });
          i++;
          continue;
        }

        i++;
      }

      this.tokens.push({ type: 'NEWLINE', value: '\n', line: this.line, column: lineStr.length });
    }

    // 残りの DEDENT を吐き出し
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.tokens.push({ type: 'DEDENT', value: '0', line: this.line, column: 0 });
    }

    this.tokens.push({ type: 'EOF', value: '', line: this.line, column: 0 });
    return this.tokens;
  }
}

// 2. Python 再帰下降 AST パーサー (Recursive Descent AST Parser)
class PythonASTParser {
  private tokens: Token[];
  private current: number = 0;
  private idCounter: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', line: 0, column: 0 };
  }

  private advance(): Token {
    const t = this.peek();
    this.current++;
    return t;
  }

  private match(type: TokenType, val?: string): boolean {
    const t = this.peek();
    if (t.type === type && (!val || t.value === val)) {
      this.advance();
      return true;
    }
    return false;
  }

  public parse(): ASTNode {
    const rootNode: ASTNode = {
      id: 'py-ast-root',
      type: 'Module',
      label: 'Module (Python 3.12 AST Root)',
      category: 'module',
      loc: {
        start: { line: 1, column: 0 },
        end: { line: this.tokens[this.tokens.length - 1]?.line || 1, column: 0 }
      },
      attributes: {
        spec: 'Python 3 Grammar AST'
      },
      children: []
    };

    while (this.peek().type !== 'EOF') {
      const stmt = this.parseStatement();
      if (stmt) {
        rootNode.children.push(stmt);
      } else {
        this.advance();
      }
    }

    return rootNode;
  }

  private parseStatement(): ASTNode | null {
    // 空改行スキップ
    while (this.match('NEWLINE')) {}

    const token = this.peek();
    if (token.type === 'EOF' || token.type === 'DEDENT') return null;

    // デコレータ (@decorator)
    if (token.type === 'PUNCTUATION' && token.value === '@') {
      return this.parseDecorated();
    }

    // 関数の定義 (def / async def)
    if (token.type === 'KEYWORD' && (token.value === 'def' || token.value === 'async')) {
      return this.parseFunctionDef();
    }

    // クラスの定義 (class)
    if (token.type === 'KEYWORD' && token.value === 'class') {
      return this.parseClassDef();
    }

    // インポート (import / from)
    if (token.type === 'KEYWORD' && (token.value === 'import' || token.value === 'from')) {
      return this.parseImport();
    }

    // 制御構文 (if, for, while, try, with, match)
    if (token.type === 'KEYWORD' && ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'match', 'case'].includes(token.value)) {
      return this.parseCompoundStmt();
    }

    // リターン文 (return)
    if (token.type === 'KEYWORD' && token.value === 'return') {
      return this.parseReturn();
    }

    // 代入文 または 式文
    return this.parseSimpleStatement();
  }

  private parseDecorated(): ASTNode | null {
    const decorators: string[] = [];
    const startLine = this.peek().line;

    while (this.match('PUNCTUATION', '@')) {
      let decName = '';
      while (this.peek().type === 'IDENTIFIER' || (this.peek().type === 'PUNCTUATION' && this.peek().value === '.')) {
        decName += this.advance().value;
      }
      if (this.match('PUNCTUATION', '(')) {
        let args = '';
        while (this.peek().type !== 'EOF' && !(this.peek().type === 'PUNCTUATION' && this.peek().value === ')')) {
          args += this.advance().value;
        }
        this.match('PUNCTUATION', ')');
        decName += `(${args})`;
      }
      decorators.push(decName);
      this.match('NEWLINE');
    }

    const defNode = this.parseStatement();
    if (defNode) {
      defNode.attributes.decorators = decorators;
      defNode.loc.start.line = startLine;
      return defNode;
    }
    return null;
  }

  private parseFunctionDef(): ASTNode {
    const isAsync = this.match('KEYWORD', 'async');
    this.match('KEYWORD', 'def');

    const nameToken = this.advance();
    const name = nameToken.value;
    const startLine = nameToken.line;

    this.match('PUNCTUATION', '(');
    const params: string[] = [];
    while (this.peek().type !== 'EOF' && !(this.peek().type === 'PUNCTUATION' && this.peek().value === ')')) {
      if (this.peek().type === 'IDENTIFIER') {
        let pName = this.advance().value;
        if (this.match('PUNCTUATION', ':')) {
          let pType = '';
          while (this.peek().type !== 'EOF' && !['PUNCTUATION', 'NEWLINE'].includes(this.peek().type)) {
            pType += this.advance().value;
          }
          pName += `: ${pType}`;
        }
        params.push(pName);
      }
      this.match('PUNCTUATION', ',');
    }
    this.match('PUNCTUATION', ')');

    let returnType: string | null = null;
    if (this.match('OPERATOR', '->')) {
      let rt = '';
      while (this.peek().type !== 'EOF' && !(this.peek().type === 'PUNCTUATION' && this.peek().value === ':')) {
        rt += this.advance().value;
      }
      returnType = rt.trim();
    }

    this.match('PUNCTUATION', ':');
    this.match('NEWLINE');

    this.idCounter++;
    const node: ASTNode = {
      id: `py-ast-${this.idCounter}-${name}`,
      type: isAsync ? 'AsyncFunctionDef' : 'FunctionDef',
      label: `${isAsync ? 'AsyncFunctionDef' : 'FunctionDef'}: ${name}(${params.join(', ')})`,
      category: 'declaration',
      loc: {
        start: { line: startLine, column: nameToken.column },
        end: { line: startLine, column: 80 }
      },
      attributes: {
        name,
        async: isAsync,
        params,
        returnType
      },
      children: []
    };

    // 関数本体の解析
    if (this.match('INDENT')) {
      while (this.peek().type !== 'EOF' && this.peek().type !== 'DEDENT') {
        const bodyStmt = this.parseStatement();
        if (bodyStmt) node.children.push(bodyStmt);
      }
      this.match('DEDENT');
    }

    return node;
  }

  private parseClassDef(): ASTNode {
    this.match('KEYWORD', 'class');
    const nameToken = this.advance();
    const name = nameToken.value;
    const startLine = nameToken.line;

    const bases: string[] = [];
    if (this.match('PUNCTUATION', '(')) {
      while (this.peek().type !== 'EOF' && !(this.peek().type === 'PUNCTUATION' && this.peek().value === ')')) {
        if (this.peek().type === 'IDENTIFIER') {
          bases.push(this.advance().value);
        }
        this.match('PUNCTUATION', ',');
      }
      this.match('PUNCTUATION', ')');
    }

    this.match('PUNCTUATION', ':');
    this.match('NEWLINE');

    this.idCounter++;
    const node: ASTNode = {
      id: `py-ast-${this.idCounter}-${name}`,
      type: 'ClassDef',
      label: `ClassDef: ${name}${bases.length ? `(${bases.join(', ')})` : ''}`,
      category: 'declaration',
      loc: {
        start: { line: startLine, column: nameToken.column },
        end: { line: startLine, column: 80 }
      },
      attributes: {
        name,
        bases
      },
      children: []
    };

    if (this.match('INDENT')) {
      while (this.peek().type !== 'EOF' && this.peek().type !== 'DEDENT') {
        const bodyStmt = this.parseStatement();
        if (bodyStmt) node.children.push(bodyStmt);
      }
      this.match('DEDENT');
    }

    return node;
  }

  private parseImport(): ASTNode {
    const isFrom = this.match('KEYWORD', 'from');
    if (!isFrom) this.match('KEYWORD', 'import');

    let importText = isFrom ? 'from ' : 'import ';
    const startLine = this.peek().line;

    while (this.peek().type !== 'EOF' && this.peek().type !== 'NEWLINE') {
      importText += `${this.advance().value} `;
    }
    this.match('NEWLINE');

    this.idCounter++;
    return {
      id: `py-ast-${this.idCounter}-import`,
      type: isFrom ? 'ImportFrom' : 'Import',
      label: importText.trim(),
      category: 'statement',
      loc: {
        start: { line: startLine, column: 0 },
        end: { line: startLine, column: importText.length }
      },
      attributes: {
        statement: importText.trim()
      },
      children: []
    };
  }

  private parseCompoundStmt(): ASTNode {
    const kwToken = this.advance();
    const keyword = kwToken.value;
    const startLine = kwToken.line;

    let condition = '';
    while (this.peek().type !== 'EOF' && !(this.peek().type === 'PUNCTUATION' && this.peek().value === ':') && this.peek().type !== 'NEWLINE') {
      condition += `${this.advance().value} `;
    }
    this.match('PUNCTUATION', ':');
    this.match('NEWLINE');

    const nodeType =
      keyword === 'if' || keyword === 'elif' || keyword === 'else'
        ? 'IfStatement'
        : keyword === 'for'
        ? 'ForStatement'
        : keyword === 'while'
        ? 'WhileStatement'
        : keyword === 'try' || keyword === 'except' || keyword === 'finally'
        ? 'TryStatement'
        : keyword === 'with'
        ? 'WithStatement'
        : 'MatchStatement';

    this.idCounter++;
    const node: ASTNode = {
      id: `py-ast-${this.idCounter}-${keyword}`,
      type: nodeType,
      label: `${nodeType}: ${keyword} ${condition.trim()}`,
      category: 'statement',
      loc: {
        start: { line: startLine, column: kwToken.column },
        end: { line: startLine, column: 80 }
      },
      attributes: {
        keyword,
        condition: condition.trim()
      },
      children: []
    };

    if (this.match('INDENT')) {
      while (this.peek().type !== 'EOF' && this.peek().type !== 'DEDENT') {
        const bodyStmt = this.parseStatement();
        if (bodyStmt) node.children.push(bodyStmt);
      }
      this.match('DEDENT');
    }

    return node;
  }

  private parseReturn(): ASTNode {
    const retToken = this.advance();
    const startLine = retToken.line;

    let expr = '';
    while (this.peek().type !== 'EOF' && this.peek().type !== 'NEWLINE') {
      expr += `${this.advance().value} `;
    }
    this.match('NEWLINE');

    this.idCounter++;
    return {
      id: `py-ast-${this.idCounter}-return`,
      type: 'ReturnStatement',
      label: `Return: ${expr.trim() || 'None'}`,
      category: 'statement',
      loc: {
        start: { line: startLine, column: retToken.column },
        end: { line: startLine, column: expr.length + 7 }
      },
      attributes: {
        value: expr.trim() || null
      },
      children: []
    };
  }

  private parseSimpleStatement(): ASTNode {
    const startLine = this.peek().line;
    let text = '';

    while (this.peek().type !== 'EOF' && this.peek().type !== 'NEWLINE') {
      text += `${this.advance().value} `;
    }
    this.match('NEWLINE');

    this.idCounter++;
    const isCall = text.includes('(') && text.includes(')');
    const isAssign = text.includes('=');

    return {
      id: `py-ast-${this.idCounter}-stmt`,
      type: isAssign ? 'Assign' : isCall ? 'CallExpression' : 'ExpressionStatement',
      label: isAssign ? `Assign: ${text.slice(0, 35).trim()}` : isCall ? `Call: ${text.slice(0, 35).trim()}` : `Stmt: ${text.slice(0, 35).trim()}`,
      category: isCall ? 'expression' : 'statement',
      loc: {
        start: { line: startLine, column: 0 },
        end: { line: startLine, column: text.length }
      },
      attributes: {
        raw: text.trim()
      },
      children: []
    };
  }
}

// 3. 公開エントリーポイント
export function buildPythonAST(code: string): ASTNode {
  try {
    const lexer = new PythonLexer(code);
    const tokens = lexer.tokenize();
    const parser = new PythonASTParser(tokens);
    return parser.parse();
  } catch (err) {
    console.warn('Python AST recursive parser fallback:', err);
    return {
      id: 'py-fallback-root',
      type: 'Module',
      label: 'Module (Fallback)',
      category: 'module',
      loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
      attributes: {},
      children: []
    };
  }
}
