import { useState, type FC } from 'react';
import type { PermissionTreeNodeVM } from '../models';

const groupStyle: React.CSSProperties = { marginBottom: 12 };
const groupLabelStyle: React.CSSProperties = { color: '#e6ecf5', fontSize: 14, fontWeight: 600, marginBottom: 6, display: 'block' };
const childStyle: React.CSSProperties = { marginLeft: 24, display: 'flex', flexDirection: 'column', gap: 4 };
const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#c0ccdc', fontSize: 13, padding: '2px 0' };
const checkboxStyle: React.CSSProperties = { accentColor: '#41d1c4', cursor: 'pointer' };

interface RolePermissionTreeProps { permissions: PermissionTreeNodeVM[]; onChange?: (perms: PermissionTreeNodeVM[]) => void; }

export const RolePermissionTree: FC<RolePermissionTreeProps> = ({ permissions, onChange }) => {
  const [localPerms, setLocalPerms] = useState(permissions);

  const toggle = (key: string) => {
    const updated = localPerms.map(p => toggleNode(p, key));
    setLocalPerms(updated);
    onChange?.(updated);
  };

  const toggleNode = (node: PermissionTreeNodeVM, key: string): PermissionTreeNodeVM => {
    if (node.key === key) return { ...node, checked: !node.checked, children: node.children?.map(c => ({ ...c, checked: !node.checked })) };
    if (node.children) return { ...node, children: node.children.map(c => toggleNode(c, key)) };
    return node;
  };

  return (
    <div>
      {localPerms.map(group => (
        <div key={group.id} style={groupStyle}>
          <label style={groupLabelStyle}>
            <input type="checkbox" checked={group.checked} onChange={() => toggle(group.key)} style={checkboxStyle} />
            {' '}{group.label}
          </label>
          {group.children && (
            <div style={childStyle}>
              {group.children.map(child => (
                <label key={child.id} style={rowStyle}>
                  <input type="checkbox" checked={child.checked} onChange={() => toggle(child.key)} style={checkboxStyle} />
                  {' '}{child.label}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
