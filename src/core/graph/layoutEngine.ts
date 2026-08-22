import { SymbolNode, CallEdge, GraphLayout, GraphNodeLayout, GraphEdgeLayout, ClusterLayout } from '../../types';

const NODE_WIDTH = 230;
const NODE_HEIGHT = 74;
const HORIZONTAL_GAP = 50;
const VERTICAL_GAP = 90;

export function computeGraphLayout(symbols: SymbolNode[], edges: CallEdge[]): GraphLayout {
  const executableSymbols = symbols.filter(
    s => s.kind === 'function' || s.kind === 'method'
  );

  if (executableSymbols.length === 0) {
    return { nodes: [], edges: [], width: 400, height: 300, clusters: [] };
  }

  const symbolMap = new Map<string, SymbolNode>();
  for (const s of executableSymbols) {
    symbolMap.set(s.name, s);
  }

  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  for (const s of executableSymbols) {
    inDegree.set(s.name, 0);
    outDegree.set(s.name, 0);
  }

  const validEdges: CallEdge[] = [];
  for (const e of edges) {
    if (symbolMap.has(e.sourceName) && symbolMap.has(e.targetName)) {
      validEdges.push(e);
      inDegree.set(e.targetName, (inDegree.get(e.targetName) || 0) + 1);
      outDegree.set(e.sourceName, (outDegree.get(e.sourceName) || 0) + 1);
    }
  }

  // レイヤー深度の割り当て
  const layers = new Map<string, number>();
  const visited = new Set<string>();

  const queue: { name: string; layer: number }[] = [];
  for (const s of executableSymbols) {
    if ((inDegree.get(s.name) || 0) === 0) {
      queue.push({ name: s.name, layer: 0 });
      layers.set(s.name, 0);
      visited.add(s.name);
    }
  }

  if (queue.length === 0) {
    for (const s of executableSymbols) {
      queue.push({ name: s.name, layer: 0 });
      layers.set(s.name, 0);
      visited.add(s.name);
      break;
    }
  }

  let head = 0;
  while (head < queue.length) {
    const { name, layer } = queue[head++];
    const outgoing = validEdges.filter(e => e.sourceName === name);

    for (const edge of outgoing) {
      const nextName = edge.targetName;
      const curLayer = layers.get(nextName) || 0;
      const newLayer = Math.max(curLayer, layer + 1);
      layers.set(nextName, newLayer);

      if (!visited.has(nextName)) {
        visited.add(nextName);
        queue.push({ name: nextName, layer: newLayer });
      }
    }
  }

  for (const s of executableSymbols) {
    if (!layers.has(s.name)) {
      layers.set(s.name, 0);
    }
  }

  // クラス別にレイヤー内を並び替え（同一クラスのメソッドが近くに並ぶように）
  const layerGroups = new Map<number, string[]>();
  for (const [name, layer] of layers.entries()) {
    const list = layerGroups.get(layer) || [];
    list.push(name);
    layerGroups.set(layer, list);
  }

  for (const [layer, names] of layerGroups.entries()) {
    names.sort((a, b) => {
      const symA = symbolMap.get(a)!;
      const symB = symbolMap.get(b)!;
      const parentA = symA.parentName || '';
      const parentB = symB.parentName || '';
      if (parentA !== parentB) return parentA.localeCompare(parentB);
      return a.localeCompare(b);
    });
  }

  // 座標の計算
  const nodeLayoutMap = new Map<string, GraphNodeLayout>();
  let maxWidth = 0;
  let currentY = 50;

  const sortedLayerKeys = Array.from(layerGroups.keys()).sort((a, b) => a - b);

  for (const layerIdx of sortedLayerKeys) {
    const namesInLayer = layerGroups.get(layerIdx)!;
    const totalRowWidth = namesInLayer.length * NODE_WIDTH + (namesInLayer.length - 1) * HORIZONTAL_GAP;
    if (totalRowWidth > maxWidth) maxWidth = totalRowWidth;

    let startX = 60;

    for (let i = 0; i < namesInLayer.length; i++) {
      const name = namesInLayer[i];
      const sym = symbolMap.get(name)!;
      const x = startX + i * (NODE_WIDTH + HORIZONTAL_GAP);
      const isEntry = (inDegree.get(name) || 0) === 0;
      const isLeaf = (outDegree.get(name) || 0) === 0;

      const nodeLayout: GraphNodeLayout = {
        id: `layout-${sym.id}`,
        symbol: sym,
        x,
        y: currentY,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        isEntry,
        isLeaf,
        layer: layerIdx,
        clusterId: sym.parentName ? `cluster-${sym.parentName}` : undefined
      };

      nodeLayoutMap.set(name, nodeLayout);
    }

    currentY += NODE_HEIGHT + VERTICAL_GAP;
  }

  const canvasWidth = Math.max(850, maxWidth + 140);
  const canvasHeight = Math.max(500, currentY + 60);

  // 中央揃えオフセット
  for (const layerIdx of sortedLayerKeys) {
    const namesInLayer = layerGroups.get(layerIdx)!;
    const rowWidth = namesInLayer.length * NODE_WIDTH + (namesInLayer.length - 1) * HORIZONTAL_GAP;
    const offset = Math.max(0, (canvasWidth - rowWidth) / 2) - 60;

    for (const name of namesInLayer) {
      const node = nodeLayoutMap.get(name);
      if (node) {
        node.x += offset;
      }
    }
  }

  // クラス別クラスタ（境界ボックス）の計算
  const clusterMap = new Map<string, { minX: number; maxX: number; minY: number; maxY: number; nodeIds: string[] }>();

  for (const node of nodeLayoutMap.values()) {
    if (node.symbol.parentName) {
      const pName = node.symbol.parentName;
      const existing = clusterMap.get(pName) || {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
        nodeIds: []
      };

      existing.minX = Math.min(existing.minX, node.x);
      existing.maxX = Math.max(existing.maxX, node.x + node.width);
      existing.minY = Math.min(existing.minY, node.y);
      existing.maxY = Math.max(existing.maxY, node.y + node.height);
      existing.nodeIds.push(node.id);

      clusterMap.set(pName, existing);
    }
  }

  const clusters: ClusterLayout[] = [];
  const PADDING = 16;

  for (const [name, bounds] of clusterMap.entries()) {
    clusters.push({
      id: `cluster-${name}`,
      name,
      x: bounds.minX - PADDING,
      y: bounds.minY - PADDING - 20,
      width: bounds.maxX - bounds.minX + PADDING * 2,
      height: bounds.maxY - bounds.minY + PADDING * 2 + 20,
      nodeIds: bounds.nodeIds
    });
  }

  // エッジレイアウト
  const edgeLayouts: GraphEdgeLayout[] = [];

  for (const e of validEdges) {
    const src = nodeLayoutMap.get(e.sourceName);
    const tgt = nodeLayoutMap.get(e.targetName);

    if (src && tgt) {
      const startPt = {
        x: src.x + src.width / 2,
        y: src.y + src.height
      };
      const endPt = {
        x: tgt.x + tgt.width / 2,
        y: tgt.y
      };

      edgeLayouts.push({
        id: e.id,
        edge: e,
        points: [startPt, endPt],
        sourceNode: src,
        targetNode: tgt
      });
    }
  }

  return {
    nodes: Array.from(nodeLayoutMap.values()),
    edges: edgeLayouts,
    clusters,
    width: canvasWidth,
    height: canvasHeight
  };
}
