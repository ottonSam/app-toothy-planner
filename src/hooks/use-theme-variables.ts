import { useMemo } from 'react';
import { vars } from 'nativewind';

import { useAuth } from '@/contexts/auth-context';
import { getThemeVariables } from '@/lib/theme';

export function useThemeVariables() {
  const { user } = useAuth();

  return useMemo(() => vars(getThemeVariables(user?.theme)), [user?.theme]);
}
