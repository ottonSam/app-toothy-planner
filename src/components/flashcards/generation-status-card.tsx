import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemePalette } from '@/hooks/use-theme-palette';
import { flashcardGenerationStatusLabels, isGenerationInProgress } from '@/lib/flashcard-utils';
import type { FlashcardGenerationJobResponse } from '@/types/api';

export function FlashcardGenerationStatusCard({ job }: { job: FlashcardGenerationJobResponse }) {
  const palette = useThemePalette();
  const progress =
    job.requestedCount > 0 ? Math.min(100, (job.createdCount / job.requestedCount) * 100) : 0;
  const inProgress = isGenerationInProgress(job.status);
  const colorFromRgb = (rgb: string) => `rgb(${rgb.split(' ').join(', ')})`;
  const statusColor =
    job.status === 'FAILED' || job.status === 'CANCELED'
      ? colorFromRgb(palette.destructiveRgb)
      : job.status === 'COMPLETED'
        ? colorFromRgb(palette.successRgb)
        : colorFromRgb(palette.infoRgb);

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-accent">
          <Ionicons
            color={statusColor}
            name={inProgress ? 'sparkles' : job.status === 'COMPLETED' ? 'checkmark' : 'alert'}
            size={22}
          />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-foreground">Geracao com IA</Text>
          <Text className="text-sm text-muted-foreground">
            {flashcardGenerationStatusLabels[job.status]}
          </Text>
        </View>
        <Text className="text-sm font-semibold text-foreground">
          {job.createdCount}/{job.requestedCount}
        </Text>
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-muted">
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.max(progress, job.status === 'PENDING' ? 2 : 0)}%` }}
        />
      </View>

      {job.errorMessage ? (
        <Text className="text-sm text-destructive" selectable>
          {job.errorMessage}
        </Text>
      ) : null}
      {inProgress ? (
        <Text className="text-xs text-muted-foreground">
          Esta tela sera atualizada enquanto as cartas sao criadas.
        </Text>
      ) : null}
    </View>
  );
}
