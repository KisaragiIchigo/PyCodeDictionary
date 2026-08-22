import { useMemo } from 'react';
import { CallEdge } from '../types';

export function usePathTracer(
  selectedNodeName: string | null,
  activeSimNode: string | null,
  callEdges: CallEdge[]
) {
  return useMemo(() => {
    const targetName = activeSimNode || selectedNodeName;
    if (!targetName) return null;

    const callers = new Set<string>();
    const callees = new Set<string>();
    const activeEdges = new Set<string>();

    for (const e of callEdges) {
      if (e.targetName === targetName) {
        callers.add(e.sourceName);
        activeEdges.add(e.id);
      }
      if (e.sourceName === targetName) {
        callees.add(e.targetName);
        activeEdges.add(e.id);
      }
    }

    return {
      selected: targetName,
      callers,
      callees,
      activeEdges
    };
  }, [selectedNodeName, activeSimNode, callEdges]);
}
