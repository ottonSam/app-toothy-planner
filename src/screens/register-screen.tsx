import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { register } from '@/api/auth';
import { ControlledInput } from '@/components/forms/controlled-input';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { Button } from '@/components/ui/button';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import type { RootDrawerParamList } from '@/navigation/types';
import { registerFormSchema, type RegisterFormData } from '@/schemas/forms';

type RegisterScreenProps = DrawerScreenProps<RootDrawerParamList, 'Register'>;

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const feedback = useMutationFeedback();
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', name: '', password: '' },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) =>
      register({ ...data, profileImage: null, theme: 'LIGHT' }),
    onError: feedback.showError,
    onSuccess: () => {
      feedback.showSuccess('Cadastro criado. Verifique seu email para ativar a conta.');
      form.reset();
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <ScreenScrollView contentClassName="flex-grow justify-center gap-6" horizontalPadding={24}>
        <View>
          <Text className="text-3xl font-semibold text-foreground">Criar conta</Text>
          <Text className="text-sm text-muted-foreground">
            Informe seus dados para iniciar o planejamento.
          </Text>
        </View>
        <FormProvider {...form}>
          <View className="gap-4 rounded-3xl border border-border bg-card p-5">
            <ControlledInput label="Nome" name="name" placeholder="Seu nome completo" />
            <ControlledInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              name="email"
              placeholder="voce@email.com"
            />
            <ControlledInput
              label="Senha"
              name="password"
              placeholder="Senha forte"
              secureTextEntry
            />
            <Button
              isLoading={registerMutation.isPending}
              onPress={form.handleSubmit((data) => registerMutation.mutate(data))}>
              Cadastrar
            </Button>
            <Button variant="ghost" onPress={() => navigation.navigate('Login')}>
              Voltar para login
            </Button>
          </View>
        </FormProvider>
      </ScreenScrollView>
      <MutationStatusDrawer
        message={feedback.message}
        onClose={() => {
          feedback.closeFeedback();
          if (feedback.status === 'success') {
            navigation.navigate('VerifyEmail');
          }
        }}
        status={feedback.status}
      />
    </KeyboardAvoidingView>
  );
}
