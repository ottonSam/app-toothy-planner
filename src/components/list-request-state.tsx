import { Image, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/api/client';

const emptyAsset = require('../../assets/emptygator.png');
const errorAsset = require('../../assets/errorgator.png');

type ListRequestStateProps<TItem> = {
  data: TItem[] | undefined;
  emptyMessage: string;
  error: unknown;
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  onRetry?: () => void;
  renderEmptyAction?: () => React.ReactNode;
  renderItem: (item: TItem) => React.ReactNode;
};

export function ListRequestState<TItem>({
  data,
  emptyMessage,
  error,
  errorMessage,
  isError,
  isLoading,
  onRetry,
  renderEmptyAction,
  renderItem,
}: ListRequestStateProps<TItem>) {
  if (isLoading) {
    return (
      <View className="gap-3">
        {[0, 1, 2].map((item) => (
          <View
            className="h-24 animate-pulse rounded-2xl border border-border bg-muted"
            key={item}
          />
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <View className="items-center gap-4 rounded-3xl border border-border bg-card p-6">
        <Image
          className="h-24 w-24"
          resizeMode="contain"
          source={errorAsset}
          style={{ height: 96, width: 96 }}
        />
        <Text className="text-center text-lg font-semibold text-foreground">
          Nao foi possivel carregar
        </Text>
        <Text className="text-center text-sm text-muted-foreground" selectable>
          {errorMessage ?? getApiErrorMessage(error)}
        </Text>
        {onRetry ? <Button onPress={onRetry}>Tentar novamente</Button> : null}
      </View>
    );
  }

  if (!data?.length) {
    return (
      <View className="items-center gap-4 rounded-3xl border border-border bg-card p-6">
        <Image
          className="h-24 w-24"
          resizeMode="contain"
          source={emptyAsset}
          style={{ height: 96, width: 96 }}
        />
        <Text className="text-center text-lg font-semibold text-foreground">Nada por aqui</Text>
        <Text className="text-center text-sm text-muted-foreground">{emptyMessage}</Text>
        {renderEmptyAction?.()}
      </View>
    );
  }

  return <View className="gap-4">{data.map(renderItem)}</View>;
}
