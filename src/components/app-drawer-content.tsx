import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useMutation } from '@tanstack/react-query';
import { Image, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getApiErrorMessage, getApiUrl } from '@/api/client';
import { useAuth } from '@/contexts/auth-context';
import { getThemePalette } from '@/lib/theme';

const logoAsset = require('../../assets/logogator.png');

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { clearUser, status, user } = useAuth();
  const palette = getThemePalette(user?.theme);
  const isDarkTheme = user?.theme === 'DARK';

  const logoutMutation = useMutation({
    mutationFn: clearUser,
    onSettled: async () => {
      props.navigation.navigate('Login');
    },
  });

  const isAuthenticated = status === 'authenticated';
  const profileImageSource = user?.profileImage ? { uri: getApiUrl(user.profileImage) } : logoAsset;
  const currentRoute = props.state.routeNames[props.state.index];
  const activeBackgroundColor = isDarkTheme ? '#d8ccb7' : palette.secondary;
  const activeTintColor = isDarkTheme ? '#1a1d19' : palette.primary;
  const drawerItemStyle = {
    activeBackgroundColor,
    activeTintColor,
    inactiveBackgroundColor: 'transparent',
    inactiveTintColor: palette.foreground,
    labelStyle: { fontWeight: '700' as const },
    style: { borderRadius: 28 },
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ backgroundColor: palette.background, flexGrow: 1 }}
      style={{ backgroundColor: palette.background }}>
      <View className="flex-1 gap-4 px-4 py-3" style={{ backgroundColor: palette.background }}>
        <View className="items-center gap-3 rounded-3xl border border-border bg-card p-4">
          <Image
            className="h-20 w-20 rounded-3xl"
            resizeMode="contain"
            source={profileImageSource}
            style={{ height: 80, width: 80 }}
          />
          <View className="items-center">
            <Text className="text-lg font-semibold text-foreground">Toothy Planner</Text>
            <Text className="text-center text-sm text-muted-foreground">
              {user ? user.name : 'Acesse sua conta'}
            </Text>
            {user ? <Text className="text-xs text-muted-foreground">{user.email}</Text> : null}
          </View>
        </View>

        {isAuthenticated ? (
          <View>
            <DrawerItem
              {...drawerItemStyle}
              focused={currentRoute === 'Diet'}
              icon={({ color, size }) => (
                <Ionicons color={color} name="nutrition-outline" size={size} />
              )}
              label="Dieta"
              onPress={() => props.navigation.navigate('Diet')}
            />
            <DrawerItem
              {...drawerItemStyle}
              focused={currentRoute === 'Financial'}
              icon={({ color, size }) => (
                <Ionicons color={color} name="wallet-outline" size={size} />
              )}
              label="Gastos"
              onPress={() => props.navigation.navigate('Financial')}
            />
            <DrawerItem
              {...drawerItemStyle}
              focused={currentRoute === 'Objectives'}
              icon={({ color, size }) => <Ionicons color={color} name="flag-outline" size={size} />}
              label="Objetivos"
              onPress={() => props.navigation.navigate('Objectives')}
            />
            <DrawerItem
              {...drawerItemStyle}
              focused={currentRoute === 'Calendars'}
              icon={({ color, size }) => (
                <Ionicons color={color} name="calendar-outline" size={size} />
              )}
              label="Calendarios"
              onPress={() => props.navigation.navigate('Calendars')}
            />
            <DrawerItem
              {...drawerItemStyle}
              focused={currentRoute === 'Profile'}
              icon={({ color, size }) => (
                <Ionicons color={color} name="person-outline" size={size} />
              )}
              label="Meu perfil"
              onPress={() => props.navigation.navigate('Profile')}
            />
          </View>
        ) : (
          <View>
            <DrawerItem
              {...drawerItemStyle}
              focused={currentRoute === 'Login'}
              icon={({ color, size }) => (
                <Ionicons color={color} name="log-in-outline" size={size} />
              )}
              label="Login"
              onPress={() => props.navigation.navigate('Login')}
            />
            <DrawerItem
              {...drawerItemStyle}
              focused={currentRoute === 'Register'}
              icon={({ color, size }) => (
                <Ionicons color={color} name="person-add-outline" size={size} />
              )}
              label="Cadastro"
              onPress={() => props.navigation.navigate('Register')}
            />
            <DrawerItem
              {...drawerItemStyle}
              focused={currentRoute === 'VerifyEmail'}
              icon={({ color, size }) => (
                <Ionicons color={color} name="mail-open-outline" size={size} />
              )}
              label="Verificar email"
              onPress={() => props.navigation.navigate('VerifyEmail')}
            />
          </View>
        )}

        <View className="mt-auto border-t border-border pt-3">
          {logoutMutation.isError ? (
            <Text className="px-4 pb-2 text-sm text-destructive">
              {getApiErrorMessage(logoutMutation.error)}
            </Text>
          ) : null}
          {isAuthenticated ? (
            <DrawerItem
              {...drawerItemStyle}
              icon={({ color, size }) => <Ionicons color={color} name="exit-outline" size={size} />}
              label={logoutMutation.isPending ? 'Saindo...' : 'Sair'}
              onPress={() => logoutMutation.mutate()}
            />
          ) : null}
        </View>
      </View>
    </DrawerContentScrollView>
  );
}
