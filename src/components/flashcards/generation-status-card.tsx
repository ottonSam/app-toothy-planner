import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemePalette } from '@/hooks/use-theme-palette';
import { flashcardGenerationStatusLabels, isGenerationInProgress } from '@/lib/flashcard-utils';
import type { FlashcardGenerationJobResponse } from '@/types/api';

export function FlashcardGenerationStatusCard({ job }: { job: FlashcardGenerationJobResponse }) {
  const palette = useThemePalette();
  const requestedCount =
    job.batches.reduce((total, batch) => total + batch.requestedCount, 0) || job.requestedCount;
  const createdCount =
    job.batches.length > 0
      ? job.batches.reduce((total, batch) => total + batch.createdCount, 0)
      : job.createdCount;
  const processedCount = job.batches.reduce(
    (total, batch) =>
      total +
      (isGenerationInProgress(batch.status)
        ? Math.min(batch.createdCount, batch.requestedCount)
        : batch.requestedCount),
    0
  );
  const progress =
    requestedCount > 0
      ? Math.min(
          100,
          ((job.batches.length > 0 ? processedCount : createdCount) / requestedCount) * 100
        )
      : 0;
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
          {createdCount}/{requestedCount}
        </Text>
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-muted">
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.max(progress, job.status === 'PENDING' ? 2 : 0)}%` }}
        />
      </View>

      {job.batches.length > 0 ? (
        <View className="gap-2 rounded-xl bg-muted p-3">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">
            Progresso dos lotes
          </Text>
          {job.batches.map((batch) => (
            <View className="flex-row items-center gap-2" key={batch.id}>
              <Text className="flex-1 text-sm font-medium text-foreground">
                Lote {batch.batchNumber}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {batch.createdCount}/{batch.requestedCount}
              </Text>
              <Text className="min-w-20 text-right text-xs font-medium text-foreground">
                {flashcardGenerationStatusLabels[batch.status]}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

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
