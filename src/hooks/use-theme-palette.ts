import { useAuth } from '@/contexts/auth-context';
import { getThemePalette } from '@/lib/theme';

export function useThemePalette() {
  const { user } = useAuth();

  return getThemePalette(user?.theme);
}
