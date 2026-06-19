import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { activateUser, requestActivationCode } from '@/api/auth';
import { ControlledInput } from '@/components/forms/controlled-input';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { Button } from '@/components/ui/button';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import type { RootDrawerParamList } from '@/navigation/types';
import {
  activationCodeFormSchema,
  activateUserFormSchema,
  type ActivateUserFormData,
} from '@/schemas/forms';

type VerifyEmailScreenProps = DrawerScreenProps<RootDrawerParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ navigation }: VerifyEmailScreenProps) {
  const feedback = useMutationFeedback();
  const form = useForm<ActivateUserFormData>({
    resolver: zodResolver(activateUserFormSchema),
    defaultValues: { code: '', email: '' },
  });

  const activationCodeMutation = useMutation({
    mutationFn: (email: string) => requestActivationCode({ email }),
    onError: feedback.showError,
    onSuccess: () => feedback.showSuccess('Codigo enviado para o email informado.'),
  });

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onError: feedback.showError,
    onSuccess: () => feedback.showSuccess('Conta ativada com sucesso.'),
  });

  const requestCode = () => {
    const parsed = activationCodeFormSchema.safeParse({ email: form.getValues('email') });
    if (!parsed.success) {
      form.setError('email', {
        message: parsed.error.issues[0]?.message ?? 'Informe um email valido.',
      });
      return;
    }
    activationCodeMutation.mutate(parsed.data.email);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <ScreenScrollView contentClassName="flex-grow justify-center gap-6" horizontalPadding={24}>
        <View>
          <Text className="text-3xl font-semibold text-foreground">Verificar email</Text>
          <Text className="text-sm text-muted-foreground">
            Solicite o codigo e ative sua conta.
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
              keyboardType="number-pad"
              label="Codigo"
              name="code"
              placeholder="123456"
            />
            <Button
              isLoading={activationCodeMutation.isPending}
              variant="secondary"
              onPress={requestCode}>
              Enviar codigo
            </Button>
            <Button
              isLoading={activateMutation.isPending}
              onPress={form.handleSubmit((data) => activateMutation.mutate(data))}>
              Ativar conta
            </Button>
            <Button variant="ghost" onPress={() => navigation.navigate('Login')}>
              Voltar para login
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
