import { type FC } from 'react';

const treeStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 };
const nodeRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', color: '#c0ccdc', fontSize: 13, cursor: 'pointer' };
const nodeLabel: React.CSSProperties = { color: '#e6ecf5', fontSize: 14, fontWeight: 500, padding: '6px 0' };
const checkboxStyle: React.CSSProperties = { accentColor: '#41d1c4', cursor: 'pointer' };
const childrenContainer: React.CSSProperties = { marginLeft: 24, borderLeft: '1px solid #2a3a52', paddingLeft: 12 };

interface TreeNode { id: string; label: string; checked: boolean; children?: TreeNode[]; }

interface PermissionCheckboxTreeProps { nodes: TreeNode[]; onChange: (nodes: TreeNode[]) => void; }

function toggleNode(node: TreeNode, id: string): TreeNode {
  if (node.id === id) {
    const newChecked = !node.checked;
    return { ...node, checked: newChecked, children: node.children?.map(c => ({ ...c, checked: newChecked })) };
  }
  if (node.children) return { ...node, children: node.children.map(c => toggleNode(c, id)) };
  return node;
}

function renderNode(node: TreeNode, onToggle: (id: string) => void, depth: number): JSX.Element {
  return (
    <div key={node.id}>
      <div style={{ ...(depth === 0 ? nodeLabel : nodeRow), paddingLeft: depth > 0 ? 8 : 0 }}>
        <input type="checkbox" checked={node.checked} onChange={() => onToggle(node.id)} style={checkboxStyle} />
        <span>{node.label}</span>
      </div>
      {node.children && node.children.length > 0 && (
        <div style={depth === 0 ? childrenContainer : { marginLeft: 16 }}>
          {node.children.map(c => renderNode(c, onToggle, depth + 1))}
        </div>
      )}
    </div>
  );
}

export const PermissionCheckboxTree: FC<PermissionCheckboxTreeProps> = ({ nodes, onChange }) => {
  const handleToggle = (id: string) => { onChange(nodes.map(n => toggleNode(n, id))); };
  return <div style={treeStyle}>{nodes.map(n => renderNode(n, handleToggle, 0))}</div>;
};
