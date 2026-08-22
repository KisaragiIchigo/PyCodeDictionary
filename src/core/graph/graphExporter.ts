import { AnalysisResult, GraphLayout } from '../../types';

export function exportAnalysisAsJson(analysis: AnalysisResult): string {
  return JSON.stringify(analysis, null, 2);
}

export function exportAnalysisAsMarkdown(analysis: AnalysisResult): string {
  const date = new Date(analysis.timestamp).toLocaleString('ja-JP');

  let md = `# 解析レポート: ${analysis.fileName}\n\n`;
  md += `- **解析日時**: ${date}\n`;
  md += `- **対象言語**: ${analysis.language.toUpperCase()}\n`;
  md += `- **コード行数**: ${analysis.metrics.totalLines}行（実コード: ${analysis.metrics.codeLines}行）\n`;
  md += `- **総合ヘルススコア**: ${analysis.metrics.healthScore} / 100\n`;
  md += `- **セキュリティスコア**: ${analysis.metrics.securityScore} / 100\n`;
  md += `- **循環的複雑度**: ${analysis.metrics.cyclomaticComplexity}\n`;
  md += `- **認知複雑度 (Cognitive)**: ${analysis.metrics.cognitiveComplexity}\n`;
  md += `- **保守性指標 (MI)**: ${analysis.metrics.maintainabilityIndex} / 100\n\n`;

  md += `## 1. 外部依存・インポート一覧 (${analysis.imports.length})\n\n`;
  if (analysis.imports.length === 0) {
    md += `*インポート文はありません。*\n\n`;
  } else {
    md += `| モジュール | シンボル | 種別 | 行 |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    for (const imp of analysis.imports) {
      md += `| \`${imp.source}\` | \`${imp.symbols.join(', ')}\` | ${imp.isStandardLib ? '標準' : '外部'} | L${imp.line} |\n`;
    }
  }

  md += `\n## 2. 定義シンボル一覧 (${analysis.symbols.length})\n\n`;
  md += `| 種別 | シンボル名 | 行番号 | パターンタグ | Docstring |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  for (const s of analysis.symbols) {
    const tags = s.tags.length > 0 ? s.tags.join(', ') : '-';
    const doc = s.docstring ? s.docstring.slice(0, 30) + '...' : '-';
    md += `| \`${s.kind}\` | **${s.name}** | L${s.startLine} - L${s.endLine} | \`${tags}\` | ${doc} |\n`;
  }

  md += `\n## 3. 関数呼び出し関係 (Call Graph - ${analysis.callEdges.length}エッジ)\n\n`;
  if (analysis.callEdges.length === 0) {
    md += `*呼び出し関係は検出されませんでした。*\n\n`;
  } else {
    for (const e of analysis.callEdges) {
      md += `- \`${e.sourceName}\` ➔ \`${e.targetName}\` (${e.count}回呼び出し, 行: ${e.lines.join(', ')})\n`;
    }
  }

  md += `\n## 4. セキュリティ脆弱性スキャン (${analysis.metrics.securityIssues?.length || 0}件)\n\n`;
  if (!analysis.metrics.securityIssues || analysis.metrics.securityIssues.length === 0) {
    md += `*脆弱性は検出されませんでした。*\n\n`;
  } else {
    for (const sec of analysis.metrics.securityIssues) {
      md += `### [${sec.severity.toUpperCase()}] L${sec.line}: ${sec.type}\n`;
      md += `- **内容**: ${sec.message}\n`;
      md += `- **対策**: ${sec.remediation}\n\n`;
    }
  }

  md += `\n## 5. リファクタリング提案\n\n`;
  if (analysis.refactorSuggestions.length === 0) {
    md += `*顕著なリファクタリング提案はありません。*\n\n`;
  } else {
    for (const sug of analysis.refactorSuggestions) {
      md += `### 💡 ${sug.title} (影響度: ${sug.impact})\n`;
      md += `${sug.description}\n\n`;
      if (sug.codeBefore && sug.codeAfter) {
        md += "```\n" + sug.codeBefore + "\n```\n➔\n```\n" + sug.codeAfter + "\n```\n\n";
      }
    }
  }

  return md;
}

export function generateSvgString(layout: GraphLayout, analysis: AnalysisResult): string {
  const { nodes, edges, clusters, width, height } = layout;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #0B0F19; font-family: 'Plus Jakarta Sans', sans-serif;">\n`;

  svg += `  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06B6D4" />
    </marker>
    <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#10B981" stop-opacity="0.8" />
    </linearGradient>
  </defs>\n`;

  // クラスタ枠描画
  for (const c of clusters) {
    svg += `  <rect x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" rx="14" fill="rgba(6, 182, 212, 0.02)" stroke="rgba(6, 182, 212, 0.25)" stroke-width="2" stroke-dasharray="4 4" />\n`;
    svg += `  <text x="${c.x + 12}" y="${c.y + 18}" font-size="11" fill="#67E8F9" font-weight="bold" font-family="'JetBrains Mono', monospace">class ${c.name}</text>\n`;
  }

  // エッジ描画
  for (const e of edges) {
    const [start, end] = e.points;
    const dy = (end.y - start.y) / 2;
    const pathD = `M ${start.x} ${start.y} C ${start.x} ${start.y + dy}, ${end.x} ${end.y - dy}, ${end.x} ${end.y}`;
    const strokeWidth = Math.min(6, 1.5 + e.edge.count * 0.8);

    svg += `  <path d="${pathD}" fill="none" stroke="url(#edgeGrad)" stroke-width="${strokeWidth}" marker-end="url(#arrow)" stroke-linecap="round" />\n`;
    if (e.edge.count > 1) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      svg += `  <circle cx="${midX}" cy="${midY}" r="10" fill="#111827" stroke="#06B6D4" stroke-width="1.5" />\n`;
      svg += `  <text x="${midX}" y="${midY + 4}" font-size="10" fill="#67E8F9" text-anchor="middle" font-weight="bold">${e.edge.count}</text>\n`;
    }
  }

  // ノード描画
  for (const n of nodes) {
    const isEntry = n.isEntry;
    const isLeaf = n.isLeaf;
    const borderColor = isEntry ? '#06B6D4' : isLeaf ? '#64748B' : '#334155';
    const borderWidth = isEntry ? 2.5 : 1.5;
    const bgColor = '#111827';

    svg += `  <g transform="translate(${n.x}, ${n.y})">
    <rect width="${n.width}" height="${n.height}" rx="10" fill="${bgColor}" stroke="${borderColor}" stroke-width="${borderWidth}" />
    <text x="14" y="24" font-size="11" fill="#94A3B8" font-family="'JetBrains Mono', monospace">${n.symbol.kind} • L${n.symbol.startLine}</text>
    <text x="14" y="46" font-size="13" fill="#F1F5F9" font-weight="600" font-family="'JetBrains Mono', monospace">${n.symbol.name}</text>
  </g>\n`;
  }

  svg += `</svg>`;
  return svg;
}
