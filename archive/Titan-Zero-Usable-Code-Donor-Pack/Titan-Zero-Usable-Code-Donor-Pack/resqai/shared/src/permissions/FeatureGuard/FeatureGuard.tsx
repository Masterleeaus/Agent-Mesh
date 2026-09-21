import { useMemo, type FC } from 'react';
import type { FeatureGuardProps } from './FeatureGuard.types';

export const FeatureGuard: FC<FeatureGuardProps> = ({ feature, enabledFeatures, fallback = null, children, style, className }) => {
  const isEnabled = useMemo(() => enabledFeatures.includes(feature), [feature, enabledFeatures]);

  if (!isEnabled) return <>{fallback}</>;
  return <div style={style} className={className}>{children}</div>;
};
