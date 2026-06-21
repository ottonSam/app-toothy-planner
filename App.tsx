import 'react-native-gesture-handler';

import { createDrawerNavigator } from '@react-navigation/drawer';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppDrawerContent } from '@/components/app-drawer-content';
import { Button } from '@/components/ui/button';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { registerServiceWorker } from '@/lib/register-service-worker';
import { getThemePalette, getThemeVariables } from '@/lib/theme';
import type { RootDrawerParamList } from '@/navigation/types';
import { CalendarsScreen } from '@/screens/calendars-screen';
import { DietScreen } from '@/screens/diet-screen';
import { FinancialScreen } from '@/screens/financial-screen';
import { LoginScreen } from '@/screens/login-screen';
import { ObjectivesScreen } from '@/screens/objectives-screen';
import { ProfileScreen } from '@/screens/profile-screen';
import { RegisterScreen } from '@/screens/register-screen';
import { VerifyEmailScreen } from '@/screens/verify-email-screen';

import './global.css';

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60,
    },
  },
});

registerServiceWorker();

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  const selectedTheme = user?.theme ?? 'LIGHT';
  const palette = getThemePalette(selectedTheme);
  const themeVariables = vars(getThemeVariables(selectedTheme));

  return (
    <View className="flex-1 bg-background" style={themeVariables}>
      <NavigationContainer>
        <Drawer.Navigator
          drawerContent={(props) => <AppDrawerContent {...props} />}
          initialRouteName="Login"
          screenOptions={{
            drawerActiveTintColor: palette.primary,
            drawerInactiveTintColor: palette.mutedForeground,
            drawerStyle: { backgroundColor: palette.background },
            headerShown: false,
          }}>
          <Drawer.Screen component={LoginScreen} name="Login" options={{ title: 'Login' }} />
          <Drawer.Screen
            component={RegisterScreen}
            name="Register"
            options={{ title: 'Cadastro' }}
          />
          <Drawer.Screen
            component={VerifyEmailScreen}
            name="VerifyEmail"
            options={{ title: 'Verificar email' }}
          />
          <Drawer.Screen name="Diet" options={{ title: 'Dieta' }}>
            {(props) => (
              <ProtectedScreen>
                <DietScreen {...props} />
              </ProtectedScreen>
            )}
          </Drawer.Screen>
          <Drawer.Screen name="Financial" options={{ title: 'Gastos' }}>
            {(props) => (
              <ProtectedScreen>
                <FinancialScreen {...props} />
              </ProtectedScreen>
            )}
          </Drawer.Screen>
          <Drawer.Screen name="Objectives" options={{ title: 'Objetivos' }}>
            {(props) => (
              <ProtectedScreen>
                <ObjectivesScreen {...props} />
              </ProtectedScreen>
            )}
          </Drawer.Screen>
          <Drawer.Screen name="Calendars" options={{ title: 'Calendarios' }}>
            {(props) => (
              <ProtectedScreen>
                <CalendarsScreen {...props} />
              </ProtectedScreen>
            )}
          </Drawer.Screen>
          <Drawer.Screen name="Profile" options={{ title: 'Meu perfil' }}>
            {(props) => (
              <ProtectedScreen>
                <ProfileScreen {...props} />
              </ProtectedScreen>
            )}
          </Drawer.Screen>
        </Drawer.Navigator>
      </NavigationContainer>
      <StatusBar style={selectedTheme === 'DARK' ? 'light' : 'dark'} />
    </View>
  );
}

function ProtectedScreen({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();
  const { status, user } = useAuth();
  const palette = getThemePalette(user?.theme);

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <ActivityIndicator color={palette.primary} />
        <Text className="text-center text-sm text-muted-foreground">Carregando sua sessao...</Text>
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Text className="text-center text-xl font-semibold text-foreground">
          Sessao nao encontrada
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          Entre novamente para acessar esta area.
        </Text>
        <Button
          onPress={() => {
            queryClient.clear();
            navigation.navigate('Login');
          }}>
          Voltar ao acesso
        </Button>
      </View>
    );
  }

  return <>{children}</>;
}
