import { SymbolNode, CallEdge, SupportedLanguage, ImportEntry } from '../../types';

export function parseGenericCode(
  code: string,
  language: SupportedLanguage
): {
  symbols: SymbolNode[];
  callEdges: CallEdge[];
  imports: ImportEntry[];
} {
  const lines = code.split('\n');
  const symbols: SymbolNode[] = [];
  const imports: ImportEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    if (language === 'sql') {
      const tableMatch = trimmed.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_]+)/i);
      if (tableMatch) {
        symbols.push({
          id: `table-${tableMatch[1]}`,
          name: tableMatch[1],
          kind: 'struct',
          startLine: lineNum,
          endLine: lineNum,
          tags: ['database'],
          calls: []
        });
      }
    } else if (language === 'cpp') {
      if (trimmed.startsWith('#include')) {
        const header = trimmed.replace('#include', '').trim();
        imports.push({
          source: header,
          symbols: [header],
          isStandardLib: header.startsWith('<'),
          line: lineNum
        });
      }

      const funcMatch = trimmed.match(/^(?:[A-Za-z0-9_:<>]+\s+)+([A-Za-z0-9_]+)\s*\((.*?)\)\s*\{?/);
      if (funcMatch && !['if', 'for', 'while', 'switch'].includes(funcMatch[1])) {
        symbols.push({
          id: `cpp-${funcMatch[1]}`,
          name: funcMatch[1],
          kind: 'function',
          startLine: lineNum,
          endLine: lineNum,
          tags: [],
          calls: []
        });
      }
    }
  }

  return {
    symbols,
    callEdges: [],
    imports
  };
}
