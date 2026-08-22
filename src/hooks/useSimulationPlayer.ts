import { useState, useRef, useEffect, useMemo } from 'react';
import { GraphLayout } from '../types';

export function useSimulationPlayer(
  layout: GraphLayout,
  externalSimulating?: boolean,
  onToggleSimulate?: () => void
) {
  const [localSimulating, setLocalSimulating] = useState<boolean>(false);
  const isSimulating = externalSimulating !== undefined ? externalSimulating : localSimulating;

  const [simulationStepIndex, setSimulationStepIndex] = useState<number>(0);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  const simulationSequence = useMemo(() => {
    const sorted = [...layout.nodes].sort((a, b) => a.layer - b.layer);
    return sorted.map(n => n.symbol.name);
  }, [layout.nodes]);

  useEffect(() => {
    if (isSimulating) {
      simTimerRef.current = setInterval(() => {
        setSimulationStepIndex(prev => {
          if (prev >= simulationSequence.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      }, 1100);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, simulationSequence]);

  const activeSimNode = isSimulating ? simulationSequence[simulationStepIndex] : null;

  const toggleSimulate = () => {
    if (onToggleSimulate) {
      onToggleSimulate();
    } else {
      setLocalSimulating(!localSimulating);
      if (!localSimulating) setSimulationStepIndex(0);
    }
  };

  return {
    isSimulating,
    simulationStepIndex,
    simulationSequence,
    activeSimNode,
    toggleSimulate
  };
}
