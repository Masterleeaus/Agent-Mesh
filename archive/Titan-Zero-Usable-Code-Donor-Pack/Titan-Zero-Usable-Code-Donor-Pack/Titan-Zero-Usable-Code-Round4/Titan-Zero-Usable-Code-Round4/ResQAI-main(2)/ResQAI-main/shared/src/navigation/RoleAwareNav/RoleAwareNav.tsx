import { useMemo, type FC } from 'react';
import type { RoleAwareNavProps, RoleNavItem } from './RoleAwareNav.types';
import { Navigation } from '../../components/Navigation';
import type { NavItem } from '../../components/Navigation';

function filterByRole(items: RoleNavItem[], userRoles: string[], userPermissions: string[]): RoleNavItem[] {
  return items.filter(item => {
    if (item.divider) return true;
    if (item.roles && !item.roles.some(r => userRoles.includes(r))) return false;
    if (item.permissions && !item.permissions.some(p => userPermissions.includes(p))) return false;
    return true;
  }).map(item => ({
    ...item,
    children: item.children ? filterByRole(item.children, userRoles, userPermissions) : undefined,
  }));
}

export const RoleAwareNav: FC<RoleAwareNavProps> = ({
  items, userRoles, userPermissions, activeId, onNavigate, fallback, variant = 'vertical', style, className,
}) => {
  const visibleItems = useMemo(() => filterByRole(items, userRoles, userPermissions), [items, userRoles, userPermissions]);

  if (visibleItems.length === 0 && fallback) return <>{fallback}</>;

  const navItems: NavItem[] = visibleItems.map(item => ({
    id: item.id, label: item.label, icon: item.icon, badge: item.badge, disabled: false, divider: item.divider,
    children: item.children?.map(c => ({ id: c.id, label: c.label, icon: c.icon, badge: c.badge, disabled: false })),
  }));

  return (
    <Navigation
      items={navItems}
      activeId={activeId}
      onNavigate={(navItem) => {
        const original = visibleItems.find(i => i.id === navItem.id);
        if (original) onNavigate(original);
      }}
      variant={variant}
      style={style}
      className={className}
    />
  );
};
