import { useState, useMemo, type FC } from 'react';
import { Input } from '../../../shared/src/components';

interface AccountOption {
  id: string;
  name: string;
  industry: string;
}

interface AccountSearchDropdownProps {
  accounts: AccountOption[];
  onSelect: (account: AccountOption) => void;
  placeholder?: string;
}

export const AccountSearchDropdown: FC<AccountSearchDropdownProps> = ({ accounts, onSelect, placeholder = 'Search accounts...' }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return accounts.filter(a => a.name.toLowerCase().includes(lower) || a.industry.toLowerCase().includes(lower));
  }, [accounts, query]);

  const handleSelect = (account: AccountOption) => {
    onSelect(account);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        type="search"
      />
      {isOpen && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#1a2439', border: '1px solid #243049', borderRadius: 6,
          marginTop: 4, maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {filtered.slice(0, 10).map((account) => (
            <div
              key={account.id}
              onMouseDown={() => handleSelect(account)}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #243049', transition: 'background 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#243049'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{ fontWeight: 500, fontSize: 13, color: '#e6ecf5' }}>{account.name}</div>
              <div style={{ fontSize: 11, color: '#8b9bb5' }}>{account.industry}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
