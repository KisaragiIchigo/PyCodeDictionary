export interface ASTLocation {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
}

export type ASTNodeCategory =
  | 'module'
  | 'declaration'
  | 'statement'
  | 'expression'
  | 'pattern'
  | 'literal'
  | 'type'
  | 'comment';

export interface ASTNode {
  id: string;
  type: string;           // e.g. "FunctionDeclaration", "CallExpression", "FunctionDef", "Assign"
  label: string;          // 表示用ラベル（e.g. "FunctionDef: calculate_total"）
  category: ASTNodeCategory;
  loc: ASTLocation;
  attributes: Record<string, any>; // 引数、戻り値型、演算子、リテラル値など
  children: ASTNode[];
  docstring?: string;
}

export interface ASTSearchResult {
  node: ASTNode;
  path: ASTNode[];
}
