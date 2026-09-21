import React, { useState, useRef, useEffect } from 'react';

interface SearchResult {
  id: string;
  name: string;
  email: string;
}

const MOCK_RESULTS: SearchResult[] = [
  { id: 'acc-1', name: 'Acme Corp', email: 'acme@example.com' },
  { id: 'acc-2', name: 'Globex Inc', email: 'globex@example.com' },
  { id: 'acc-3', name: 'Initech', email: 'initech@example.com' },
  { id: 'acc-4', name: 'Umbrella Co', email: 'umbrella@example.com' },
  { id: 'acc-5', name: 'Hooli LLC', email: 'hooli@example.com' },
];

interface AccountSearchDropdownProps {
  onSelect: (account: { id: string; name: string }) => void;
  placeholder?: string;
  excludeIds?: string[];
}

export function AccountSearchDropdown({ onSelect, placeholder = 'Search accounts...', excludeIds = [] }: AccountSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const filtered = MOCK_RESULTS.filter(
      (r) =>
        !excludeIds.includes(r.id) &&
        (r.name.toLowerCase().includes(query.toLowerCase()) || r.email.toLowerCase().includes(query.toLowerCase()))
    );
    setResults(filtered);
  }, [query, excludeIds]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (r: SearchResult) => {
    onSelect({ id: r.id, name: r.name });
    setQuery(r.name);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => query && setIsOpen(true)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: 13,
          color: '#e6ecf5',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {isOpen && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 6,
            marginTop: 4,
            zIndex: 100,
            maxHeight: 200,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {results.map((r) => (
            <div
              key={r.id}
              onClick={() => handleSelect(r)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #334155',
                fontSize: 13,
                color: '#cbd5e1',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div style={{ fontWeight: 500, color: '#e6ecf5' }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#8b9bb5' }}>{r.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
