import type { UserTheme } from '@/types/api';

export const appThemes = {
  DARK: {
    background: '#191c19',
    backgroundRgb: '25 28 25',
    borderRgb: '73 79 70',
    cardRgb: '35 39 35',
    destructiveRgb: '226 103 91',
    inputRgb: '86 92 80',
    foreground: '#efeae0',
    foregroundRgb: '239 234 224',
    accentRgb: '72 76 62',
    infoRgb: '105 155 186',
    mutedRgb: '43 48 43',
    primary: '#9ab05b',
    primaryRgb: '154 176 91',
    secondary: '#383d34',
    secondaryRgb: '56 61 52',
    successRgb: '118 166 96',
    warningRgb: '220 161 72',
    mutedForeground: '#beb5a6',
    mutedForegroundRgb: '190 181 166',
  },
  LIGHT: {
    background: '#f6f1e8',
    backgroundRgb: '246 241 232',
    borderRgb: '214 205 190',
    cardRgb: '250 246 238',
    destructiveRgb: '184 73 62',
    inputRgb: '206 196 178',
    foreground: '#3a332b',
    foregroundRgb: '58 51 43',
    accentRgb: '230 224 206',
    infoRgb: '62 110 139',
    mutedRgb: '240 233 221',
    primary: '#5b6c32',
    primaryRgb: '91 108 50',
    secondary: '#e9e1d3',
    secondaryRgb: '233 225 211',
    successRgb: '79 125 58',
    warningRgb: '201 137 45',
    mutedForeground: '#6e6153',
    mutedForegroundRgb: '110 97 83',
  },
} satisfies Record<UserTheme, Record<string, string>>;

export function getThemePalette(theme: UserTheme | null | undefined) {
  return appThemes[theme ?? 'LIGHT'];
}

export function getThemeVariables(theme: UserTheme | null | undefined) {
  const palette = getThemePalette(theme);

  return {
    '--color-background': palette.backgroundRgb,
    '--color-foreground': palette.foregroundRgb,
    '--color-card': palette.cardRgb,
    '--color-primary': palette.primaryRgb,
    '--color-secondary': palette.secondaryRgb,
    '--color-muted': palette.mutedRgb,
    '--color-accent': palette.accentRgb,
    '--color-border': palette.borderRgb,
    '--color-input': palette.inputRgb,
    '--color-destructive': palette.destructiveRgb,
    '--color-success': palette.successRgb,
    '--color-warning': palette.warningRgb,
    '--color-info': palette.infoRgb,
    '--color-muted-foreground': palette.mutedForegroundRgb,
  };
}
