import { useCallback } from 'react';

export function useNavigate() {
  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  return navigate;
}
