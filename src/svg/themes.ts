export interface ThemePalette {
  background: string;
  border: string;
  title: string;
  text: string;
  icon: string;
  bar: string;
  barBackground: string;
  statLabel: string;
}

export const themes: Record<string, ThemePalette> = {
  default: {
    background: 'ffffff',
    border: 'e4e2e2',
    title: '2f80ed',
    text: '434d58',
    icon: '4c71f2',
    bar: '4c71f2',
    barBackground: 'dfe2e5',
    statLabel: '586069',
  },
  dark: {
    background: '0d1117',
    border: '30363d',
    title: '58a6ff',
    text: 'c9d1d9',
    icon: '58a6ff',
    bar: '58a6ff',
    barBackground: '21262d',
    statLabel: '8b949e',
  },
  radical: {
    background: '141321',
    border: 'fe428e',
    title: 'fe428e',
    text: 'a9fef7',
    icon: 'fe428e',
    bar: 'fe428e',
    barBackground: '2a2139',
    statLabel: 'fe428e',
  },
  merko: {
    background: '0a0f0b',
    border: '386e30',
    title: 'abd200',
    text: '68b587',
    icon: 'abd200',
    bar: 'abd200',
    barBackground: '1c3a20',
    statLabel: '68b587',
  },
  gruvbox: {
    background: '282828',
    border: '689d6a',
    title: 'fabd2f',
    text: 'ebdbb2',
    icon: 'd79921',
    bar: 'b8bb26',
    barBackground: '3c3836',
    statLabel: 'a89984',
  },
  tokyonight: {
    background: '1a1b27',
    border: '414868',
    title: '70a5fd',
    text: '38bdae',
    icon: '70a5fd',
    bar: '70a5fd',
    barBackground: '24283b',
    statLabel: '565f89',
  },
  onedark: {
    background: '282c34',
    border: '3e4451',
    title: '61afef',
    text: 'abb2bf',
    icon: '61afef',
    bar: '98c379',
    barBackground: '3e4451',
    statLabel: '5c6370',
  },
  cobalt: {
    background: '193549',
    border: '0480ef',
    title: 'e3d18a',
    text: 'ffffff',
    icon: 'e3d18a',
    bar: '0480ef',
    barBackground: '1b4669',
    statLabel: 'b0c4de',
  },
  synthwave: {
    background: '2b213a',
    border: 'e2d9f3',
    title: 'e2d9f3',
    text: 'ffffff',
    icon: 'ef8539',
    bar: 'ef8539',
    barBackground: '3c2d54',
    statLabel: 'b38ec0',
  },
  highcontrast: {
    background: '000000',
    border: 'ffffff',
    title: 'ffffff',
    text: 'ffffff',
    icon: 'ffffff',
    bar: 'ffffff',
    barBackground: '333333',
    statLabel: 'cccccc',
  },
  dracula: {
    background: '282a36',
    border: '6272a4',
    title: 'ff79c6',
    text: 'f8f8f2',
    icon: 'ff79c6',
    bar: '50fa7b',
    barBackground: '44475a',
    statLabel: '6272a4',
  },
  steam: {
    background: '1b2838',
    border: '4c6b8a',
    title: '66c0f4',
    text: 'c6d4df',
    icon: '66c0f4',
    bar: '66c0f4',
    barBackground: '2a3f5f',
    statLabel: '8f98a0',
  },
};

export function resolveTheme(themeName: string, overrides: Partial<ThemePalette>): ThemePalette {
  const base = themes[themeName] ?? themes['default']!;
  return { ...base, ...overrides };
}
