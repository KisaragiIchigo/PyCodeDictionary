import { parse } from '@babel/parser';
import { ASTNode } from '../../types/ast';

export function buildTsJsAST(code: string): ASTNode {
  const lines = code.split('\n');

  try {
    const plugins: any[] = [
      'typescript',
      'jsx',
      ['decorators', { decoratorsBeforeExport: true }]
    ];

    const babelAst = parse(code, {
      sourceType: 'unambiguous',
      plugins,
      errorRecovery: true
    });

    let idCounter = 0;

    const convertNode = (node: any): ASTNode | null => {
      if (!node || typeof node !== 'object' || !node.type) return null;

      idCounter++;
      const type: string = node.type;

      let category: ASTNode['category'] = 'expression';
      if (type === 'Program' || type === 'File') category = 'module';
      else if (type.endsWith('Declaration') || type.endsWith('Def') || type === 'TSInterfaceDeclaration' || type === 'TSTypeAliasDeclaration') category = 'declaration';
      else if (type.endsWith('Statement')) category = 'statement';
      else if (type.endsWith('Expression') || type.endsWith('Literal') || type === 'Identifier') category = 'expression';

      let label = type;
      if (node.id && node.id.name) {
        label = `${type}: ${node.id.name}`;
      } else if (node.key && node.key.name) {
        label = `${type}: ${node.key.name}`;
      } else if (node.name) {
        label = `${type}: ${node.name}`;
      } else if (node.value !== undefined) {
        label = `${type} (${String(node.value).slice(0, 20)})`;
      } else if (node.callee) {
        const calleeName = node.callee.name || (node.callee.property ? node.callee.property.name : 'callee');
        label = `CallExpression: ${calleeName}()`;
      }

      const loc = {
        start: {
          line: node.loc ? node.loc.start.line : 1,
          column: node.loc ? node.loc.start.column : 0
        },
        end: {
          line: node.loc ? node.loc.end.line : lines.length,
          column: node.loc ? node.loc.end.column : (lines[lines.length - 1]?.length || 0)
        }
      };

      const attributes: Record<string, any> = {};
      if (node.id?.name) attributes.name = node.id.name;
      if (node.kind) attributes.kind = node.kind;
      if (node.async) attributes.async = true;
      if (node.generator) attributes.generator = true;
      if (node.operator) attributes.operator = node.operator;
      if (node.value !== undefined) attributes.value = node.value;
      if (node.params) {
        attributes.params = node.params.map((p: any) => p.name || p.type || 'param');
      }

      const children: ASTNode[] = [];

      for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'start' || key === 'end' || key === 'comments' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
        const val = node[key];

        if (Array.isArray(val)) {
          for (const item of val) {
            const childNode = convertNode(item);
            if (childNode) children.push(childNode);
          }
        } else if (val && typeof val === 'object' && val.type) {
          const childNode = convertNode(val);
          if (childNode) children.push(childNode);
        }
      }

      return {
        id: `babel-${idCounter}-${type}`,
        type,
        label,
        category,
        loc,
        attributes,
        children
      };
    };

    const root = convertNode(babelAst.program);
    if (root) return root;
  } catch (err) {
    console.warn('@babel/parser parse warning, falling back to structural parser:', err);
  }

  return {
    id: 'ts-fallback-root',
    type: 'Program',
    label: 'Program (Fallback)',
    category: 'module',
    loc: {
      start: { line: 1, column: 0 },
      end: { line: lines.length, column: lines[lines.length - 1]?.length || 0 }
    },
    attributes: { linesCount: lines.length },
    children: []
  };
}
