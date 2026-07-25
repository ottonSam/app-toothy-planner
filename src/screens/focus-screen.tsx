import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { AppState, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ControlledInput } from '@/components/forms/controlled-input';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { focusCompletionSound } from '@/lib/focus-completion-sound';
import {
  loadFocusPreferences,
  loadTodayFocusSessions,
  saveFocusPreferences,
  saveTodayFocusSessions,
} from '@/lib/focus-storage';
import type { RootDrawerParamList } from '@/navigation/types';
import { focusSessionFormSchema, type FocusSessionFormData } from '@/schemas/forms';

type FocusScreenProps = DrawerScreenProps<RootDrawerParamList, 'Focus'>;
type FocusMode = 'FOCUS' | 'BREAK';

export function FocusScreen({ navigation }: FocusScreenProps) {
  const palette = useThemePalette();
  const completionSoundPlayer = useAudioPlayer(focusCompletionSound);
  const alarmStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [initialPreferences] = useState(loadFocusPreferences);
  const [focusMinutes, setFocusMinutes] = useState(initialPreferences.focusMinutes);
  const [breakMinutes, setBreakMinutes] = useState(initialPreferences.breakMinutes);
  const [mode, setMode] = useState<FocusMode>('FOCUS');
  const [remainingSeconds, setRemainingSeconds] = useState(initialPreferences.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(loadTodayFocusSessions);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Pronto para iniciar o foco.');

  const form = useForm<FocusSessionFormData>({
    resolver: zodResolver(focusSessionFormSchema),
    defaultValues: {
      breakMinutes: String(initialPreferences.breakMinutes),
      focusMinutes: String(initialPreferences.focusMinutes),
    },
  });

  const totalSeconds = mode === 'FOCUS' ? focusMinutes * 60 : breakMinutes * 60;
  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0;
  const progressPercent = Math.min(100, Math.max(0, progress * 100));

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [remainingSeconds]);

  const stopCompletionAlarm = useCallback(() => {
    if (alarmStopTimeoutRef.current) {
      clearTimeout(alarmStopTimeoutRef.current);
      alarmStopTimeoutRef.current = null;
    }

    try {
      completionSoundPlayer.pause();
      completionSoundPlayer.loop = false;
      void completionSoundPlayer.seekTo(0).catch(() => undefined);
    } catch {
      // The timer must continue even if audio is unavailable.
    }
  }, [completionSoundPlayer]);

  const playCompletionSound = useCallback(async () => {
    stopCompletionAlarm();

    try {
      completionSoundPlayer.volume = 1;
      completionSoundPlayer.loop = true;
      await completionSoundPlayer.seekTo(0);
      completionSoundPlayer.play();
      alarmStopTimeoutRef.current = setTimeout(stopCompletionAlarm, 5000);
    } catch {
      stopCompletionAlarm();
    }
  }, [completionSoundPlayer, stopCompletionAlarm]);

  useEffect(() => stopCompletionAlarm, [stopCompletionAlarm]);

  useEffect(() => {
    void setAudioModeAsync({
      interruptionMode: 'duckOthers',
      playsInSilentMode: true,
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const refreshDailySessions = () => {
      setCompletedFocusSessions(loadTodayFocusSessions());
    };
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshDailySessions();
      }
    });
    const dateCheckInterval = setInterval(refreshDailySessions, 60_000);

    return () => {
      appStateSubscription.remove();
      clearInterval(dateCheckInterval);
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((currentSeconds) => Math.max(0, currentSeconds - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || remainingSeconds !== 0) {
      return;
    }

    void playCompletionSound();

    if (mode === 'FOCUS') {
      const nextSessionCount = loadTodayFocusSessions() + 1;
      saveTodayFocusSessions(nextSessionCount);
      setCompletedFocusSessions(nextSessionCount);
      setMode('BREAK');
      setRemainingSeconds(breakMinutes * 60);
      setStatusMessage('Foco finalizado. Descanso iniciado.');
      return;
    }

    setMode('FOCUS');
    setRemainingSeconds(focusMinutes * 60);
    setIsRunning(false);
    setStatusMessage('Descanso finalizado. Inicie um novo foco quando estiver pronto.');
  }, [breakMinutes, focusMinutes, isRunning, mode, playCompletionSound, remainingSeconds]);

  const openSettings = () => {
    form.reset({
      breakMinutes: String(breakMinutes),
      focusMinutes: String(focusMinutes),
    });
    setIsSettingsOpen(true);
  };

  const saveSettings = (data: FocusSessionFormData) => {
    const nextPreferences = {
      breakMinutes: Number(data.breakMinutes),
      focusMinutes: Number(data.focusMinutes),
    };

    saveFocusPreferences(nextPreferences);
    setFocusMinutes(nextPreferences.focusMinutes);
    setBreakMinutes(nextPreferences.breakMinutes);
    setMode('FOCUS');
    setRemainingSeconds(nextPreferences.focusMinutes * 60);
    setIsRunning(false);
    setIsSettingsOpen(false);
    setStatusMessage('Tempos salvos. Pronto para iniciar o foco.');
  };

  const startTimer = () => {
    setIsRunning(true);
    setStatusMessage(mode === 'FOCUS' ? 'Foco em andamento.' : 'Descanso em andamento.');
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setStatusMessage(mode === 'FOCUS' ? 'Foco pausado.' : 'Descanso pausado.');
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMode('FOCUS');
    setRemainingSeconds(focusMinutes * 60);
    setStatusMessage('Relogio reiniciado.');
  };

  const modeLabel = mode === 'FOCUS' ? 'Foco' : 'Descanso';
  const nextStepLabel = mode === 'FOCUS' ? `${breakMinutes} min de descanso` : 'Novo foco';

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
            <Text className="text-3xl font-semibold text-foreground">Foco</Text>
            <Text className="text-sm text-muted-foreground">
              Concentre-se em uma sessao por vez.
            </Text>
          </View>
        </View>

        <View className="gap-5 rounded-2xl border border-border bg-card p-5">
          <View className="flex-row items-center">
            <View className="w-16 items-center gap-1">
              <View
                className="h-14 w-14 items-center justify-center rounded-full border"
                style={{ borderColor: palette.primary }}>
                <Ionicons
                  color={palette.primary}
                  name={mode === 'FOCUS' ? 'flash-outline' : 'cafe-outline'}
                  size={28}
                />
              </View>
              <Text className="text-xs font-semibold uppercase text-muted-foreground">
                {modeLabel}
              </Text>
            </View>

            <View className="flex-1 items-center">
              <Text
                className="text-5xl font-semibold text-foreground md:text-6xl"
                selectable
                style={{ fontVariant: ['tabular-nums'] }}>
                {formattedTime}
              </Text>
            </View>

            <View className="w-16 items-center">
              <Pressable
                accessibilityHint="Abre as preferencias de foco e descanso"
                accessibilityLabel="Editar tempos"
                accessibilityRole="button"
                className="h-14 w-14 items-center justify-center rounded-full border border-border bg-muted"
                onPress={openSettings}>
                <Ionicons color={palette.foreground} name="settings-outline" size={26} />
              </Pressable>
            </View>
          </View>

          <View className="gap-2">
            <View className="h-3 overflow-hidden rounded-full bg-muted">
              <View
                className="h-3 rounded-full bg-primary"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <View className="gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <Text className="flex-1 text-sm text-muted-foreground">{statusMessage}</Text>
              <Text className="text-sm font-semibold text-foreground">
                Proximo: {nextStepLabel}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            {isRunning ? (
              <Button className="flex-1" variant="secondary" onPress={pauseTimer}>
                Pausar
              </Button>
            ) : (
              <Button className="flex-1" onPress={startTimer}>
                {remainingSeconds === totalSeconds ? 'Iniciar' : 'Continuar'}
              </Button>
            )}
            <Button className="flex-1" variant="outline" onPress={resetTimer}>
              Resetar
            </Button>
          </View>
        </View>

        <View className="grid gap-3 md:grid-cols-3">
          <FocusStatCard label="Tempo de foco" value={`${focusMinutes} min`} />
          <FocusStatCard label="Descanso" value={`${breakMinutes} min`} />
          <FocusStatCard label="Sessoes de foco hoje" value={String(completedFocusSessions)} />
        </View>
      </ScreenScrollView>

      <BottomDrawer
        contentClassName="gap-5"
        maxHeight="75%"
        onClose={() => setIsSettingsOpen(false)}
        visible={isSettingsOpen}>
        <FormProvider {...form}>
          <View className="flex-row items-start gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Ionicons color={palette.primary} name="settings-outline" size={24} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xl font-semibold text-foreground">
                Preferencias do temporizador
              </Text>
              <Text className="text-sm text-muted-foreground">
                Os tempos ficam salvos neste dispositivo.
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Fechar preferencias"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full"
              onPress={() => setIsSettingsOpen(false)}>
              <Ionicons color={palette.mutedForeground} name="close" size={24} />
            </Pressable>
          </View>

          <View className="gap-4">
            <ControlledInput
              inputMode="numeric"
              keyboardType="number-pad"
              label="Tempo de foco"
              name="focusMinutes"
              placeholder="25"
            />
            <ControlledInput
              inputMode="numeric"
              keyboardType="number-pad"
              label="Tempo de descanso"
              name="breakMinutes"
              placeholder="5"
            />
          </View>

          <View className="flex-row gap-2">
            <Button className="flex-1" variant="secondary" onPress={() => setIsSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onPress={form.handleSubmit(saveSettings)}>
              Salvar tempos
            </Button>
          </View>
        </FormProvider>
      </BottomDrawer>
    </View>
  );
}

function FocusStatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1 rounded-2xl border border-border bg-card p-4">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-2xl font-semibold text-foreground" selectable>
        {value}
      </Text>
    </View>
  );
}
