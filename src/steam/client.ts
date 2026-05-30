const STEAM_API_BASE = 'https://api.steampowered.com';
const FETCH_TIMEOUT_MS = 5000;

export class SteamError extends Error {
  constructor(
    message: string,
    public readonly code: 'network' | 'private' | 'not_found' | 'no_data' | 'api_error',
  ) {
    super(message);
    this.name = 'SteamError';
  }
}

function getApiKey(): string {
  const key = process.env['STEAM_API_KEY'];
  if (!key) throw new SteamError('STEAM_API_KEY not set', 'api_error');
  return key;
}

async function steamFetch(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new SteamError(`Steam API returned ${response.status}`, 'api_error');
    }
    return await response.json();
  } catch (err) {
    if (err instanceof SteamError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new SteamError('Steam API request timed out', 'network');
    }
    throw new SteamError('Steam API network error', 'network');
  } finally {
    clearTimeout(timeout);
  }
}

export interface PlayerSummary {
  steamid: string;
  personaname: string;
  avatarmedium: string;
  avatarfull: string;
  profileurl: string;
  communityvisibilitystate: number;
  personastate: number;
  gameid?: string;
  gameextrainfo?: string;
}

export interface OwnedGame {
  appid: number;
  name?: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  img_icon_url?: string;
}

export interface RecentGame {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  img_icon_url: string;
}

export interface PlayerAchievement {
  apiname: string;
  achieved: 0 | 1;
}

export async function resolveVanityUrl(vanityUrl: string): Promise<string> {
  const key = getApiKey();
  const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v0001/?key=${key}&vanityurl=${encodeURIComponent(vanityUrl)}`;
  const data = (await steamFetch(url)) as {
    response: { success: number; steamid?: string };
  };
  if (data.response.success !== 1 || !data.response.steamid) {
    throw new SteamError('Vanity URL not found', 'not_found');
  }
  return data.response.steamid;
}

export async function getPlayerSummaries(steamId: string): Promise<PlayerSummary> {
  const key = getApiKey();
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${key}&steamids=${steamId}`;
  const data = (await steamFetch(url)) as {
    response: { players: PlayerSummary[] };
  };
  const player = data.response.players[0];
  if (!player) throw new SteamError('Steam ID not found', 'not_found');
  return player;
}

export async function getRecentlyPlayedGames(steamId: string, count = 5): Promise<RecentGame[]> {
  const key = getApiKey();
  const url = `${STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${key}&steamid=${steamId}&count=${count}`;
  const data = (await steamFetch(url)) as {
    response: { games?: RecentGame[] };
  };
  if (!data.response.games) {
    throw new SteamError('No recent games — profile may be private', 'private');
  }
  return data.response.games;
}

export async function getOwnedGames(
  steamId: string,
  includePlayedFreeGames = true,
): Promise<OwnedGame[]> {
  const key = getApiKey();
  const freeFlag = includePlayedFreeGames ? 1 : 0;
  const url =
    `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/?key=${key}&steamid=${steamId}` +
    `&include_appinfo=1&include_played_free_games=${freeFlag}`;
  const data = (await steamFetch(url)) as {
    response: { games?: OwnedGame[] };
  };
  if (!data.response.games) {
    throw new SteamError('No game library — profile may be private', 'private');
  }
  return data.response.games;
}

export async function getPlayerAchievements(
  steamId: string,
  appId: number,
): Promise<PlayerAchievement[]> {
  const key = getApiKey();
  const url =
    `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v0001/?key=${key}` +
    `&steamid=${steamId}&appid=${appId}`;
  const data = (await steamFetch(url)) as {
    playerstats: { success: boolean; achievements?: PlayerAchievement[]; error?: string };
  };
  if (!data.playerstats.success) {
    throw new SteamError(data.playerstats.error ?? 'Achievements unavailable', 'no_data');
  }
  return data.playerstats.achievements ?? [];
}

export async function getSchemaForGame(appId: number): Promise<number> {
  const key = getApiKey();
  const url = `${STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/?key=${key}&appid=${appId}`;
  const data = (await steamFetch(url)) as {
    game?: { availableGameStats?: { achievements?: unknown[] } };
  };
  return data.game?.availableGameStats?.achievements?.length ?? 0;
}

export function getGameIconUrl(appId: number, iconHash: string): string {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
}
