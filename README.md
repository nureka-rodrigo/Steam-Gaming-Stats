# Steam Readme Stats

> Embeddable, auto-updating SVG cards for your Steam profile — drop a URL into any GitHub README and get live stats with
> no JavaScript, no iframes, and no GitHub Actions required.

---

## Quick Start

Paste a URL into your Markdown file. GitHub fetches it, receives a valid SVG, and renders it inline.

```md
![Recently Played](https://steam-gaming-stats.netlify.app/api/recently-played?steamid=YOUR_STEAM_ID)
```

Replace `YOUR_STEAM_ID` with your **SteamID64** (e.g. `76561198890357762`) or your **vanity URL username** (e.g.
`nureka-rodrigo`).

> **Finding your SteamID64:** Open your Steam profile in a browser. The URL will look like
> `steamcommunity.com/id/nureka-rodrigo` (vanity) or `steamcommunity.com/profiles/76561198890357762` (SteamID64). You can also
> use [steamid.io](https://steamid.io) to look it up.

---

## Cards

### Recently Played

Games you've played in the last two weeks with relative playtime bars.

```md
![Recently Played](https://steam-gaming-stats.netlify.app/api/recently-played?steamid=YOUR_ID&theme=dark)
```

### Top Games

Your all-time top games ranked by total hours.

```md
![Top Games](https://steam-gaming-stats.netlify.app/api/top-games?steamid=YOUR_ID&theme=tokyonight&count=5)
```

### Library Overview

Total games owned, games played, total hours, and top game.

```md
![Library](https://steam-gaming-stats.netlify.app/api/library?steamid=YOUR_ID&theme=dracula)
```

### Achievement Showcase

Completion percentage for up to five games of your choice.

```md
![Achievements](https://steam-gaming-stats.netlify.app/api/achievements?steamid=YOUR_ID&appids=730,570)
```

Use the App ID from a game's Steam store page URL, e.g. `store.steampowered.com/app/730/` → `730`.

### Profile Overview

Avatar, online status, total hours, and recently played game.

```md
![Profile](https://steam-gaming-stats.netlify.app/api/profile?steamid=YOUR_ID&theme=steam)
```

### Recent Activity

Bar chart of per-game playtime over the last two weeks.

```md
![Recent Activity](https://steam-gaming-stats.netlify.app/api/heatmap?steamid=YOUR_ID&theme=gruvbox)
```

### Playtime Milestone

Total hours with fun milestone labels.

```md
![Milestone](https://steam-gaming-stats.netlify.app/api/milestone?steamid=YOUR_ID&theme=synthwave)
```

### Steam Level

Steam level, XP earned in the current level, and a progress bar to the next level.

```md
![Steam Level](https://steam-gaming-stats.netlify.app/api/steam-level?steamid=YOUR_ID&theme=dark)
```

### Game Stats

Top stats for a specific game, ranked by value with display names sourced from the game's own schema.

```md
![Game Stats](https://steam-gaming-stats.netlify.app/api/game-stats?steamid=YOUR_ID&appid=730&theme=tokyonight)
```

Use the App ID from the game's Steam store page URL, e.g. `store.steampowered.com/app/730/` → `730`. Not all games expose stats through the Steam Web API — the card will show "No Stats Available" for those.

---

## Parameters

### Universal

Every card accepts these parameters.

| Parameter       | Default      | Description                                    |
| --------------- | ------------ | ---------------------------------------------- |
| `steamid`       | **required** | SteamID64 (`76561198…`) or vanity URL username |
| `theme`         | `default`    | Color theme name (see [Themes](#themes))       |
| `hide_border`   | `false`      | Remove the card border                         |
| `hide_bg`       | `false`      | Transparent background                         |
| `border_radius` | `4`          | Corner radius in SVG units (0–20)              |
| `title_color`   | theme        | Hex color for the card title (no `#`)          |
| `text_color`    | theme        | Hex color for body text                        |
| `icon_color`    | theme        | Hex color for header icon                      |
| `bg_color`      | theme        | Hex color for the background                   |
| `border_color`  | theme        | Hex color for the border                       |
| `locale`        | `en`         | IETF language tag for number formatting        |
| `cache_seconds` | `3600`       | Cache TTL (minimum 14400, maximum 86400)       |

Boolean parameters accept `true`/`false`, `1`/`0`, `yes`/`no` (case-insensitive).

### Card-Specific

| Card            | Parameter                | Default      | Description                                               |
| --------------- | ------------------------ | ------------ | --------------------------------------------------------- |
| recently-played | `count`                  | `5`          | Number of games to show (1–5)                             |
| recently-played | `show_playtime`          | `true`       | Show playtime label next to each bar                      |
| recently-played | `show_icons`             | `true`       | Show game icons                                           |
| top-games       | `count`                  | `5`          | Number of games to show (1–10)                            |
| top-games       | `show_icons`             | `true`       | Show game icons                                           |
| top-games       | `show_rank_numbers`      | `true`       | Show rank numbers (1., 2., …)                             |
| library         | `show_free_games`        | `true`       | Include free-to-play games in counts                      |
| library         | `highlight_top_game`     | `true`       | Show the most-played game stat box                        |
| achievements    | `appids`                 | **required** | Comma-separated App IDs (max 5)                           |
| achievements    | `show_ratio`             | `true`       | Show earned/total ratio                                   |
| achievements    | `progress_style`         | `bar`        | Progress indicator style: `bar` or `arc`                  |
| profile         | `show_avatar`            | `true`       | Show the player avatar                                    |
| profile         | `show_status`            | `true`       | Show online/offline/in-game status                        |
| profile         | `show_currently_playing` | `true`       | Show currently or recently played game                    |
| milestone       | `milestone_style`        | `fun`        | Label style: `fun` (humorous) or `numeric`                |
| game-stats      | `appid`                  | **required** | Steam App ID of the game                                  |
| game-stats      | `count`                  | `5`          | Number of stats to show (1–10)                            |
| game-stats      | `stats`                  | —            | Comma-separated internal stat names to pin specific stats |

---

## Themes

Append `&theme=NAME` to any card URL.

| Name           | Preview                             |
| -------------- | ----------------------------------- |
| `default`      | White background, blue accents      |
| `dark`         | GitHub dark mode (#0d1117)          |
| `radical`      | Deep pink on dark purple            |
| `merko`        | Terminal green on near-black        |
| `gruvbox`      | Warm retro earthy palette           |
| `tokyonight`   | Deep navy with blue/purple accents  |
| `onedark`      | Atom One Dark slate                 |
| `cobalt`       | Royal blue with gold accents        |
| `synthwave`    | Neon pink/orange on deep dark       |
| `highcontrast` | Maximum contrast — black/white only |
| `dracula`      | Classic Dracula pink/cyan/green     |
| `steam`        | Steam's own charcoal/blue-gray UI   |

Individual color overrides take precedence over the theme:

```md
![Card](https://steam-gaming-stats.netlify.app/api/recently-played?steamid=YOUR_ID&theme=dark&title_color=ff6e96)
```

---

## Steam Privacy Requirements

Your Steam profile **Game Details** must be set to **Public** for the cards to work.

**Steam → Profile → Edit Profile → Privacy Settings → Game Details → Public**

Cards for private profiles return a styled error SVG explaining the issue.

---

## Support

If you find this useful, consider buying me a coffee!

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/nureka.rodrigo)

---

## License

[MIT](LICENSE) — Nureka Rodrigo
