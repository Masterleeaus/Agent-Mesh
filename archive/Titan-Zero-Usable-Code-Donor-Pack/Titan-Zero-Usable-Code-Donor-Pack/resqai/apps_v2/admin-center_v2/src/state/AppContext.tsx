import { createContext, useContext, useState, useCallback, type FC, type ReactNode } from 'react';
import type { AuditLogFilterRequest } from '../models';

interface AdminUser { id: string; name: string; email: string; role: string; }
interface AppFilters { auditLog: AuditLogFilterRequest; }
interface AuditPagination { page: number; pageSize: number; total: number; }

interface AppContextValue {
  currentAdmin: AdminUser | null;
  setCurrentAdmin: (user: AdminUser | null) => void;
  filters: AppFilters;
  setFilters: (filters: AppFilters) => void;
  auditPagination: AuditPagination;
  setAuditPagination: (pagination: AuditPagination) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [filters, setFilters] = useState<AppFilters>({ auditLog: {} });
  const [auditPagination, setAuditPagination] = useState<AuditPagination>({ page: 1, pageSize: 20, total: 0 });

  return (
    <AppContext.Provider value={{ currentAdmin, setCurrentAdmin, filters, setFilters, auditPagination, setAuditPagination }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
