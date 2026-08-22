import { useState, useRef, useCallback } from 'react';

export function useLayoutState() {
  const [sidebarWidth, setSidebarWidth] = useState<number>(320);
  const isResizingSidebarRef = useRef<boolean>(false);

  const [splitRatio, setSplitRatio] = useState<number>(0.5);
  const isResizingMainSplitRef = useRef<boolean>(false);
  const mainWorkspaceRef = useRef<HTMLDivElement>(null);

  const [sidebarTab, setSidebarTab] = useState<'project' | 'ast' | 'dict' | 'architecture' | 'symbols' | 'quality'>('ast');
  const [viewLayout, setViewLayout] = useState<'split' | 'code-only' | 'map-only'>('split');
  const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // サイドバー リサイズ
  const handleMouseDownSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSidebarRef.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingSidebarRef.current) return;
      const newWidth = Math.min(650, Math.max(220, moveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingSidebarRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // メインスプリッター リサイズ
  const handleMouseDownMainSplitResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingMainSplitRef.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingMainSplitRef.current || !mainWorkspaceRef.current) return;
      const rect = mainWorkspaceRef.current.getBoundingClientRect();

      if (splitOrientation === 'horizontal') {
        const offsetX = moveEvent.clientX - rect.left;
        const ratio = offsetX / rect.width;
        setSplitRatio(Math.min(0.85, Math.max(0.15, ratio)));
      } else {
        const offsetY = moveEvent.clientY - rect.top;
        const ratio = offsetY / rect.height;
        setSplitRatio(Math.min(0.85, Math.max(0.15, ratio)));
      }
    };

    const handleMouseUp = () => {
      isResizingMainSplitRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [splitOrientation]);

  return {
    sidebarWidth,
    setSidebarWidth,
    splitRatio,
    setSplitRatio,
    sidebarTab,
    setSidebarTab,
    viewLayout,
    setViewLayout,
    splitOrientation,
    setSplitOrientation,
    mainWorkspaceRef,
    handleMouseDownSidebarResize,
    handleMouseDownMainSplitResize
  };
}
