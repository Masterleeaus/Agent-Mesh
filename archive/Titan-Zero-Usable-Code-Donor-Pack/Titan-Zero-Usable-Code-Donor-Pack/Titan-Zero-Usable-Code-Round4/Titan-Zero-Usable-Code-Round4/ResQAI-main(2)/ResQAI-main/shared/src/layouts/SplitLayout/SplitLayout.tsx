import { useState, useRef, useCallback, type FC } from 'react';
import type { SplitLayoutProps } from './SplitLayout.types';

export const SplitLayout: FC<SplitLayoutProps> = ({
  left, right, defaultRatio = 0.5, minLeftWidth = 200, minRightWidth = 200,
  gutter = 4, direction = 'horizontal', style, className,
}) => {
  const [ratio, setRatio] = useState(defaultRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); dragging.current = true;
    const startX = e.clientX; const startRatio = ratio;
    const container = containerRef.current;
    if (!container) return;
    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const rect = container.getBoundingClientRect();
      const size = direction === 'horizontal' ? rect.width : rect.height;
      const delta = ev.clientX - startX;
      let newRatio = startRatio + delta / size;
      const minLeft = minLeftWidth / size;
      const minRight = minRightWidth / size;
      newRatio = Math.max(minLeft, Math.min(1 - minRight, newRatio));
      setRatio(newRatio);
    };
    const handleMouseUp = () => { dragging.current = false; document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [ratio, direction, minLeftWidth, minRightWidth]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div ref={containerRef} style={{
      display: 'flex', flexDirection: isHorizontal ? 'row' : 'column',
      height: '100%', overflow: 'hidden', ...style,
    }} className={className}>
      <div style={{ flex: `${ratio} 1 0`, overflow: 'auto', minWidth: isHorizontal ? minLeftWidth : undefined, minHeight: !isHorizontal ? minLeftWidth : undefined }}>
        {left}
      </div>
      <div
        onMouseDown={handleMouseDown}
        style={{
          flex: `0 0 ${gutter}px`,
          cursor: isHorizontal ? 'col-resize' : 'row-resize',
          backgroundColor: 'var(--border, #e2e8f0)',
          backgroundClip: 'content-box',
          padding: isHorizontal ? '0 2px' : '2px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        <div style={{
          width: isHorizontal ? 2 : 16, height: isHorizontal ? 16 : 2,
          backgroundColor: 'var(--text-muted, #94a3b8)', borderRadius: 1,
        }} />
      </div>
      <div style={{ flex: `${1 - ratio} 1 0`, overflow: 'auto', minWidth: isHorizontal ? minRightWidth : undefined, minHeight: !isHorizontal ? minRightWidth : undefined }}>
        {right}
      </div>
    </div>
  );
};
