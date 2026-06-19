import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { updateCurrentUser, updateProfileImage } from '@/api/auth';
import { getApiUrl } from '@/api/client';
import { ControlledInput } from '@/components/forms/controlled-input';
import { ControlledSelect } from '@/components/forms/controlled-select';
import { ListRequestState } from '@/components/list-request-state';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { queryKeys } from '@/lib/query-keys';
import type { RootDrawerParamList } from '@/navigation/types';
import {
  passwordUpdateFormSchema,
  profileFormSchema,
  profileImageFormSchema,
  type PasswordUpdateFormData,
  type ProfileFormData,
} from '@/schemas/forms';
import type { UserResponse } from '@/types/api';

type ProfileScreenProps = DrawerScreenProps<RootDrawerParamList, 'Profile'>;

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const queryClient = useQueryClient();
  const { refreshUser, setAuthenticatedUser, status, user } = useAuth();
  const feedback = useMutationFeedback();
  const palette = useThemePalette();
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [profileImageVersion, setProfileImageVersion] = useState(Date.now());

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', theme: 'LIGHT' },
  });
  const passwordForm = useForm<PasswordUpdateFormData>({
    resolver: zodResolver(passwordUpdateFormSchema),
    defaultValues: { password: '', passwordConfirmation: '' },
  });
  const invalidateCurrentUser = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.user });
  };

  const profileMutation = useMutation({
    mutationFn: updateCurrentUser,
    onError: feedback.showError,
    onSuccess: async (updatedUser) => {
      setAuthenticatedUser(updatedUser);
      await invalidateCurrentUser();
      feedback.showSuccess('Perfil atualizado com sucesso.');
      setIsProfileFormOpen(false);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordUpdateFormData) => updateCurrentUser({ password: data.password }),
    onError: feedback.showError,
    onSuccess: async (updatedUser) => {
      setAuthenticatedUser(updatedUser);
      await invalidateCurrentUser();
      passwordForm.reset({ password: '', passwordConfirmation: '' });
      feedback.showSuccess('Senha atualizada com sucesso.');
      setIsPasswordFormOpen(false);
    },
  });

  const imageMutation = useMutation({
    mutationFn: updateProfileImage,
    onError: feedback.showError,
    onSuccess: async () => {
      await refreshUser();
      await invalidateCurrentUser();
      setProfileImageVersion(Date.now());
      feedback.showSuccess('Foto de perfil atualizada com sucesso.');
    },
  });

  const openProfileForm = (profileUser: UserResponse) => {
    profileForm.reset({ name: profileUser.name, theme: profileUser.theme });
    setIsProfileFormOpen(true);
  };

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      feedback.showError(new Error('Permita o acesso a galeria para selecionar uma foto.'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const image = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : '';
    const parsed = profileImageFormSchema.safeParse({ image });

    if (!parsed.success) {
      feedback.showError(
        new Error(parsed.error.issues[0]?.message ?? 'Selecione uma imagem valida.')
      );
      return;
    }

    imageMutation.mutate(parsed.data);
  };

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
            <Text className="text-3xl font-semibold text-foreground">Meu perfil</Text>
            <Text className="text-sm text-muted-foreground">Dados principais da sua conta.</Text>
          </View>
        </View>
        <ListRequestState
          data={user ? [user] : []}
          emptyMessage="Nao ha dados de perfil para exibir."
          error={null}
          isError={status === 'unauthenticated'}
          isLoading={status === 'loading'}
          onRetry={() => {
            void refreshUser();
          }}
          renderItem={(profileUser) => (
            <ProfileCard
              imageVersion={profileImageVersion}
              isImagePending={imageMutation.isPending}
              key={profileUser.id}
              onEditPassword={() => setIsPasswordFormOpen(true)}
              onEditPhoto={pickProfileImage}
              onEditProfile={() => openProfileForm(profileUser)}
              user={profileUser}
            />
          )}
        />
      </ScreenScrollView>
      <ProfileFormDrawer
        form={profileForm}
        isOpen={isProfileFormOpen}
        isPending={profileMutation.isPending}
        onClose={() => setIsProfileFormOpen(false)}
        onSubmit={(data) => profileMutation.mutate(data)}
      />
      <PasswordFormDrawer
        form={passwordForm}
        isOpen={isPasswordFormOpen}
        isPending={passwordMutation.isPending}
        onClose={() => setIsPasswordFormOpen(false)}
        onSubmit={(data) => passwordMutation.mutate(data)}
      />
      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </View>
  );
}

function ProfileCard({
  imageVersion,
  isImagePending,
  onEditPassword,
  onEditPhoto,
  onEditProfile,
  user,
}: {
  imageVersion: number;
  isImagePending: boolean;
  onEditPassword: () => void;
  onEditPhoto: () => void;
  onEditProfile: () => void;
  user: UserResponse;
}) {
  const imageSource = user.profileImage
    ? { uri: `${getApiUrl(user.profileImage)}?v=${imageVersion}` }
    : require('../../assets/logogator.png');

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="items-center gap-3">
        <Image
          className="h-28 w-28 rounded-full"
          resizeMode="cover"
          source={imageSource}
          style={{ height: 112, width: 112 }}
        />
        <Button isLoading={isImagePending} size="sm" variant="secondary" onPress={onEditPhoto}>
          Trocar foto
        </Button>
      </View>
      <View>
        <Text className="text-xs font-semibold uppercase text-muted-foreground">Nome</Text>
        <Text className="text-lg font-semibold text-foreground">{user.name}</Text>
      </View>
      <View>
        <Text className="text-xs font-semibold uppercase text-muted-foreground">Email</Text>
        <Text className="text-base text-foreground">{user.email}</Text>
      </View>
      <View className="flex-row gap-2">
        <Text className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
          Tema {user.theme === 'DARK' ? 'escuro' : 'claro'}
        </Text>
        <Text className="rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">
          {user.isActive ? 'Ativo' : 'Inativo'}
        </Text>
      </View>
      <View className="gap-2">
        <Button onPress={onEditProfile}>Editar usuario</Button>
        <Button variant="secondary" onPress={onEditPassword}>
          Alterar senha
        </Button>
      </View>
    </View>
  );
}

function ProfileFormDrawer({
  form,
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ProfileFormData>>;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: ProfileFormData) => void;
}) {
  return (
    <BottomDrawer onClose={onClose} visible={isOpen}>
      <Text className="text-xl font-semibold text-foreground">Editar usuario</Text>
      <FormProvider {...form}>
        <ControlledInput label="Nome" name="name" placeholder="Seu nome" />
        <ControlledSelect
          label="Tema"
          name="theme"
          options={[
            { label: 'Claro', value: 'LIGHT' },
            { label: 'Escuro', value: 'DARK' },
          ]}
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

function PasswordFormDrawer({
  form,
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<PasswordUpdateFormData>>;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: PasswordUpdateFormData) => void;
}) {
  return (
    <BottomDrawer onClose={onClose} visible={isOpen}>
      <Text className="text-xl font-semibold text-foreground">Alterar senha</Text>
      <FormProvider {...form}>
        <ControlledInput
          autoComplete="new-password"
          label="Nova senha"
          name="password"
          placeholder="Nova senha"
          secureTextEntry
        />
        <ControlledInput
          autoComplete="new-password"
          label="Confirmar senha"
          name="passwordConfirmation"
          placeholder="Repita a nova senha"
          secureTextEntry
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
