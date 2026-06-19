import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Image, KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { getCurrentUser, login } from '@/api/auth';
import { ControlledInput } from '@/components/forms/controlled-input';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import type { RootDrawerParamList } from '@/navigation/types';
import { loginFormSchema, type LoginFormData } from '@/schemas/forms';

const logoAsset = require('../../assets/logogator.png');

type LoginScreenProps = DrawerScreenProps<RootDrawerParamList, 'Login'>;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { setAuthenticatedUser, status } = useAuth();
  const feedback = useMutationFeedback();
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onError: feedback.showError,
    onSuccess: async () => {
      const user = await getCurrentUser();
      setAuthenticatedUser(user);
      navigation.navigate('Diet');
    },
  });

  useEffect(() => {
    if (status === 'authenticated') {
      navigation.navigate('Diet');
    }
  }, [navigation, status]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <ScreenScrollView contentClassName="flex-grow justify-center gap-6" horizontalPadding={24}>
        <View className="items-center gap-3">
          <Image
            className="h-24 w-24"
            resizeMode="contain"
            source={logoAsset}
            style={{ height: 96, width: 96 }}
          />
          <Text className="text-center text-3xl font-semibold text-foreground">Toothy Planner</Text>
          <Text className="text-center text-sm text-muted-foreground">
            Entre para acompanhar seus objetivos.
          </Text>
        </View>

        <FormProvider {...form}>
          <View className="gap-4 rounded-3xl border border-border bg-card p-5">
            <ControlledInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              name="email"
              placeholder="voce@email.com"
            />
            <ControlledInput
              autoComplete="password"
              label="Senha"
              name="password"
              placeholder="Sua senha"
              secureTextEntry
            />
            <Button
              isLoading={loginMutation.isPending}
              onPress={form.handleSubmit((data) => loginMutation.mutate(data))}>
              Entrar
            </Button>
            <Button variant="ghost" onPress={() => navigation.navigate('Register')}>
              Criar conta
            </Button>
            <Button variant="ghost" onPress={() => navigation.navigate('VerifyEmail')}>
              Verificar email
            </Button>
          </View>
        </FormProvider>
      </ScreenScrollView>
      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </KeyboardAvoidingView>
  );
}
