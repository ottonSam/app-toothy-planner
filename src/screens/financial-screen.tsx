import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  createExpenseWallet,
  listExpenseWallets,
  updateExpenseWallet,
} from '@/api/financial-manager';
import { CardActionsMenu } from '@/components/card-actions-menu';
import { ControlledInput } from '@/components/forms/controlled-input';
import { ListRequestState } from '@/components/list-request-state';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { formatCurrencyBr } from '@/lib/financial-utils';
import { queryKeys } from '@/lib/query-keys';
import type { RootDrawerParamList } from '@/navigation/types';
import { expenseWalletFormSchema, type ExpenseWalletFormData } from '@/schemas/forms';
import { FinancialCycleScreen } from '@/screens/financial-cycle-screen';
import type { ExpenseWalletResponse } from '@/types/api';

type FinancialScreenProps = DrawerScreenProps<RootDrawerParamList, 'Financial'>;

export function FinancialScreen({ navigation }: FinancialScreenProps) {
  const queryClient = useQueryClient();
  const feedback = useMutationFeedback();
  const palette = useThemePalette();
  const [selectedWallet, setSelectedWallet] = useState<ExpenseWalletResponse | null>(null);
  const [editingWallet, setEditingWallet] = useState<ExpenseWalletResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const walletsQuery = useQuery({
    queryKey: queryKeys.expenseWallets,
    queryFn: listExpenseWallets,
  });
  const form = useForm<ExpenseWalletFormData>({
    resolver: zodResolver(expenseWalletFormSchema),
    defaultValues: { cycleEndDay: '', description: '', spendingGoal: '' },
  });

  const walletMutation = useMutation({
    mutationFn: (data: ExpenseWalletFormData) => {
      const body = {
        cycleEndDay: Number(data.cycleEndDay),
        description: data.description,
        spendingGoal: parseDecimal(data.spendingGoal),
      };

      return editingWallet
        ? updateExpenseWallet(editingWallet.id, body)
        : createExpenseWallet(body);
    },
    onError: feedback.showError,
    onSuccess: async (savedWallet) => {
      queryClient.setQueryData<ExpenseWalletResponse[]>(queryKeys.expenseWallets, (wallets) => {
        if (!wallets) {
          return [savedWallet];
        }

        return editingWallet
          ? wallets.map((wallet) => (wallet.id === savedWallet.id ? savedWallet : wallet))
          : [...wallets, savedWallet];
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenseWallets });
      await queryClient.invalidateQueries({
        queryKey: ['user', 'financial-manager', 'wallets', savedWallet.id],
      });
      feedback.showSuccess(
        editingWallet ? 'Carteira atualizada com sucesso.' : 'Carteira criada com sucesso.'
      );
      closeForm();
    },
  });

  const openCreateForm = () => {
    setEditingWallet(null);
    form.reset({ cycleEndDay: '', description: '', spendingGoal: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (wallet: ExpenseWalletResponse) => {
    setEditingWallet(wallet);
    form.reset({
      cycleEndDay: String(wallet.cycleEndDay),
      description: wallet.description,
      spendingGoal: String(wallet.spendingGoal).replace('.', ','),
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingWallet(null);
    form.reset({ cycleEndDay: '', description: '', spendingGoal: '' });
  };

  if (selectedWallet) {
    return <FinancialCycleScreen onBack={() => setSelectedWallet(null)} wallet={selectedWallet} />;
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenScrollView>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Abrir menu"
            accessibilityRole="button"
            onPress={() => navigation.openDrawer()}>
            <Ionicons color={palette.foreground} name="menu" size={28} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-semibold text-foreground">Gastos</Text>
            <Text className="text-sm text-muted-foreground">
              Selecione uma carteira para acompanhar seus ciclos.
            </Text>
          </View>
          <Button size="sm" onPress={openCreateForm}>
            Nova
          </Button>
        </View>

        <ListRequestState
          data={walletsQuery.data}
          emptyMessage="Nenhuma carteira cadastrada."
          error={walletsQuery.error}
          isError={walletsQuery.isError}
          isLoading={walletsQuery.isLoading}
          onRetry={() => walletsQuery.refetch()}
          renderEmptyAction={() => <Button onPress={openCreateForm}>Criar carteira</Button>}
          renderItem={(wallet) => (
            <WalletCard
              key={wallet.id}
              onEdit={() => openEditForm(wallet)}
              onSelect={() => setSelectedWallet(wallet)}
              wallet={wallet}
            />
          )}
        />
      </ScreenScrollView>

      <WalletFormDrawer
        form={form}
        isEditing={Boolean(editingWallet)}
        isOpen={isFormOpen}
        isPending={walletMutation.isPending}
        onClose={closeForm}
        onSubmit={(data) => walletMutation.mutate(data)}
      />
      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </View>
  );
}

function WalletCard({
  onEdit,
  onSelect,
  wallet,
}: {
  onEdit: () => void;
  onSelect: () => void;
  wallet: ExpenseWalletResponse;
}) {
  const palette = useThemePalette();

  return (
    <View className="relative gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold text-foreground">{wallet.description}</Text>
          <Text className="text-sm text-muted-foreground">
            Meta por ciclo: {formatCurrencyBr(wallet.spendingGoal)}
          </Text>
        </View>
        <CardActionsMenu
          accessibilityLabel="Abrir acoes da carteira"
          actions={[
            { label: 'Editar', onPress: onEdit },
            {
              disabled: true,
              label: 'Excluir',
              onPress: () => undefined,
              variant: 'destructive',
            },
          ]}
        />
      </View>

      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <View className="self-start rounded-full bg-secondary px-3 py-1">
            <Text className="text-xs font-semibold text-foreground">
              Fecha dia {wallet.cycleEndDay}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel="Visualizar ciclos"
          accessibilityRole="button"
          className="h-12 w-12 items-center justify-center rounded-full bg-primary"
          onPress={onSelect}>
          <Ionicons color={palette.background} name="chevron-forward" size={24} />
        </Pressable>
      </View>
    </View>
  );
}

function WalletFormDrawer({
  form,
  isEditing,
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ExpenseWalletFormData>>;
  isEditing: boolean;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseWalletFormData) => void;
}) {
  return (
    <BottomDrawer onClose={onClose} visible={isOpen}>
      <Text className="text-xl font-semibold text-foreground">
        {isEditing ? 'Editar carteira' : 'Nova carteira'}
      </Text>
      <FormProvider {...form}>
        <ControlledInput label="Descricao" name="description" placeholder="Ex: Carteira pessoal" />
        <ControlledInput
          keyboardType="decimal-pad"
          label="Meta de gastos"
          name="spendingGoal"
          placeholder="3000,00"
        />
        <ControlledInput
          description="Dia em que o ciclo mensal termina."
          keyboardType="number-pad"
          label="Dia de encerramento"
          name="cycleEndDay"
          placeholder="15"
        />
        <View className="flex-row gap-2 pt-2">
          <Button className="flex-1" variant="secondary" onPress={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" isLoading={isPending} onPress={form.handleSubmit(onSubmit)}>
            Salvar
          </Button>
        </View>
      </FormProvider>
    </BottomDrawer>
  );
}

function parseDecimal(value: string) {
  return Number(value.replace(',', '.'));
}
