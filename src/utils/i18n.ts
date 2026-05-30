export interface LocaleStrings {
  recentlyPlayed: string;
  topGames: string;
  libraryOverview: string;
  achievements: string;
  profileOverview: string;
  recentActivity: string;
  playTimeMilestone: string;
  totalGames: string;
  gamesPlayed: string;
  totalHours: string;
  topGame: string;
  online: string;
  offline: string;
  inGame: string;
  noRecentActivity: string;
  privateProfile: string;
  noAchievements: string;
  hours: string;
  minutes: string;
}

const EN: LocaleStrings = {
  recentlyPlayed: 'Recently Played',
  topGames: 'Top Games by Playtime',
  libraryOverview: 'Game Library Overview',
  achievements: 'Achievement Showcase',
  profileOverview: 'Profile Overview',
  recentActivity: 'Recent Activity',
  playTimeMilestone: 'Playtime Milestone',
  totalGames: 'Total Games',
  gamesPlayed: 'Games Played',
  totalHours: 'Total Hours',
  topGame: 'Top Game',
  online: 'Online',
  offline: 'Offline',
  inGame: 'In-Game',
  noRecentActivity: 'No Recent Activity',
  privateProfile: 'Profile is Private',
  noAchievements: 'No Achievements',
  hours: 'h',
  minutes: 'm',
};

const LOCALES: Record<string, LocaleStrings> = { en: EN };

export function getStrings(locale: string): LocaleStrings {
  return LOCALES[locale] ?? LOCALES['en']!;
}

export function formatPlaytime(minutes: number, locale: string): string {
  const s = getStrings(locale);
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}${s.minutes}`;
  if (mins === 0) return `${hrs}${s.hours}`;
  return `${hrs}${s.hours} ${mins}${s.minutes}`;
}

export function formatNumber(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return n.toString();
  }
}
