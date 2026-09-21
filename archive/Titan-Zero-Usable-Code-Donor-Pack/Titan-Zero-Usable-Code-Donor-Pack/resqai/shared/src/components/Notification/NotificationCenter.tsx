import { useState, type FC } from 'react';
import type { NotificationCenterProps, NotificationToast } from './Notification.types';
import { Notification } from './Notification';
import { spacing, animation } from '../../design-system/tokens';

const positionStyles = {
  'top-right': { top: spacing[4], right: spacing[4] },
  'top-left': { top: spacing[4], left: spacing[4] },
  'bottom-right': { bottom: spacing[4], right: spacing[4] },
  'bottom-left': { bottom: spacing[4], left: spacing[4] },
};

const enterAnimation = { animation: `slideInRight ${animation.duration.normal} ${animation.easing.ease}` };
const exitAnimation = { animation: `fadeOut ${animation.duration.fast} ${animation.easing.ease}` };

export const NotificationCenter: FC<NotificationCenterProps> = ({
  notifications, onDismiss, position = 'top-right', maxVisible = 5, style, className,
}) => {
  const [exiting, setExiting] = useState<Record<string, boolean>>({});

  const visible = notifications.slice(0, maxVisible);

  const handleDismiss = (id: string) => {
    setExiting(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setExiting(prev => { const { [id]: _, ...rest } = prev; return rest; });
      onDismiss(id);
    }, 200);
  };

  return (
    <div
      style={{
        position: 'fixed', zIndex: 10000, display: 'flex', flexDirection: 'column',
        gap: spacing[2], pointerEvents: 'none', minWidth: 320, maxWidth: 420,
        ...positionStyles[position], ...style,
      }}
      className={className}
    >
      {visible.map(n => (
        <div key={n.id} style={{ pointerEvents: 'auto', ...(exiting[n.id] ? exitAnimation : enterAnimation) }}>
          <Notification
            variant={n.variant}
            title={n.title}
            onClose={() => handleDismiss(n.id)}
            action={n.action}
            dismissible={n.dismissible}
            icon={n.icon}
            compact={n.compact}
          >
            {n.message}
          </Notification>
        </div>
      ))}
    </div>
  );
};
