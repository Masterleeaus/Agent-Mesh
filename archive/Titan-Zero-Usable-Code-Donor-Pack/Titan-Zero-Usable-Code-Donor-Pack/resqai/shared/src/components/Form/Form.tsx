import { useMemo, type FC } from 'react';
import type { FormProps, FormFieldProps, FormSectionProps } from './Form.types';
import { spacing, typography } from '../../design-system/tokens';

const spacingMap = { compact: spacing[2], normal: spacing[4], relaxed: spacing[6] };
const layoutMap = { vertical: 'column' as const, horizontal: 'row' as const, inline: 'row' as const };

export const Form: FC<FormProps> & { Field: FC<FormFieldProps>; Section: FC<FormSectionProps> } = ({
  children, onSubmit, spacing: formSpacing = 'normal', layout = 'vertical',
  noValidate = false, style, className,
}) => {
  const formStyle = useMemo(() => ({
    display: 'flex', flexDirection: 'column' as const, gap: spacingMap[formSpacing],
    width: '100%', ...style,
  }), [formSpacing, style]);

  return (
    <form style={formStyle} className={className} onSubmit={onSubmit} noValidate={noValidate}>
      {children}
    </form>
  );
};

const FormField: FC<FormFieldProps> = ({ children, label, error, hint, required, layout: fieldLayout, style, className }) => {
  const isHorizontal = fieldLayout === 'horizontal';
  return (
    <div style={{
      display: 'flex', flexDirection: isHorizontal ? 'row' : 'column',
      gap: isHorizontal ? spacing[3] : spacing[1],
      alignItems: isHorizontal ? 'flex-start' : undefined,
      ...style,
    }} className={className}>
      {label && (
        <label style={{
          fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium,
          color: 'var(--text-secondary, #475569)', fontFamily: typography.fontFamily.body,
          minWidth: isHorizontal ? '120px' : undefined, paddingTop: isHorizontal ? spacing[2] : undefined,
        }}>
          {label}{required && <span style={{ color: 'var(--error, #dc2626)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing[0.5] }}>
        {children}
        {hint && !error && <span style={{ fontSize: typography.fontSize.xs, color: 'var(--text-muted, #94a3b8)' }}>{hint}</span>}
        {error && <span style={{ fontSize: typography.fontSize.xs, color: 'var(--error, #dc2626)' }} role="alert">{error}</span>}
      </div>
    </div>
  );
};

const FormSection: FC<FormSectionProps> = ({ children, title, description, style, className }) => (
  <div style={{
    padding: spacing[4], border: '1px solid var(--border, #e2e8f0)',
    borderRadius: '0.5rem', ...style,
  }} className={className}>
    {title && <h3 style={{ margin: `0 0 ${spacing[1]} 0`, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: 'var(--text-primary, #0f172a)', fontFamily: typography.fontFamily.heading }}>{title}</h3>}
    {description && <p style={{ margin: `0 0 ${spacing[3]} 0`, fontSize: typography.fontSize.sm, color: 'var(--text-secondary, #475569)', fontFamily: typography.fontFamily.body }}>{description}</p>}
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>{children}</div>
  </div>
);

Form.Field = FormField;
Form.Section = FormSection;
