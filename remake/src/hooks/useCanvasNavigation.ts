import { useState, useRef, useCallback, useEffect } from 'react';
import { GraphLayout } from '../types';

export function useCanvasNavigation(layout: GraphLayout) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleFit = useCallback(() => {
    if (!containerRef.current || layout.nodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scaleX = (clientWidth - 80) / layout.width;
    const scaleY = (clientHeight - 80) / layout.height;
    const newScale = Math.min(1.1, Math.max(0.35, Math.min(scaleX, scaleY)));
    const offsetX = (clientWidth - layout.width * newScale) / 2;
    const offsetY = (clientHeight - layout.height * newScale) / 2;
    setScale(newScale);
    setPan({ x: offsetX, y: offsetY });
  }, [layout]);

  useEffect(() => {
    handleFit();
  }, [handleFit]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(2.5, Math.max(0.25, scale * zoomFactor));

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan({
      x: mouseX - (mouseX - pan.x) * (newScale / scale),
      y: mouseY - (mouseY - pan.y) * (newScale / scale)
    });
    setScale(newScale);
  }, [scale, pan]);

  return {
    containerRef,
    scale,
    setScale,
    pan,
    setPan,
    isDragging,
    handleFit,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel
  };
}
