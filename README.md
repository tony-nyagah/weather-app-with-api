# ⛅ WeatherNow

A real-time weather app built with a neubrutalist design. Search any city in the world and instantly see temperature, conditions, humidity, wind speed, and direction — no API key required.

---

## Features

- **City search** — type any city name and hit GO
- **Live weather data** — temperature, feels like, condition, humidity, wind speed & compass direction
- **Weather icon** — emoji icon per WMO weather code (23 distinct conditions mapped)
- **Dynamic card header** — card accent colour shifts based on current conditions (yellow for clear, blue for rain, orange for thunderstorms, etc.)
- **Country flag** — rendered from the ISO 3166-1 alpha-2 country code using Unicode regional indicators
- **Loading state** — staggered bouncing block animation while fetching
- **Error handling** — city-not-found and network failures both surface a clear error card
- **Responsive** — single-column layout that works on any screen width
- **No API key** — fully free, no sign-up, no rate-limit surprises

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Build tool | [Vite 8](https://vite.dev) | Instant dev server, native ESM, fast HMR |
| Language | TypeScript 6 | Strict types catch API shape mismatches at compile time |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [DaisyUI v5](https://daisyui.com) | Utility-first with DaisyUI providing the base reset and theming layer |
| API | [Open-Meteo](https://open-meteo.com) | Completely free, no key, no account — geocoding and weather in two clean REST calls |
| Font | [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (900 weight) | Geometric and heavy — essential for the neubrutalist look |

---

## API Design

Weather data is fetched in two sequential calls, both to Open-Meteo:

**1. Geocoding** — resolves a city name to coordinates:
```
GET https://geocoding-api.open-meteo.com/v1/search
    ?name={city}&count=1&language=en&format=json
```

**2. Current weather** — fetches live conditions at those coordinates:
```
GET https://api.open-meteo.com/v1/forecast
    ?latitude={lat}&longitude={lon}
    &current=temperature_2m,relative_humidity_2m,apparent_temperature,
             weather_code,wind_speed_10m,wind_direction_10m
    &wind_speed_unit=kmh&timezone=auto
```

The response's `weather_code` is a [WMO code](https://open-meteo.com/en/docs#weathervariables). A static lookup table maps all 23 relevant codes to a human-readable description and an emoji icon.

---

## Project Structure

```
src/
├── weather.ts   — types, WMO code map, geocoding + weather API calls, helper functions
├── main.ts      — app shell HTML, four render-state functions, form event handler
└── style.css    — Tailwind + DaisyUI imports, body font/background, bounce-block keyframe

public/
└── favicon.svg  — hand-drawn neubrutalist sun (yellow fill, square-cap rays, black stroke)
```

There is no framework, no component system, and no client-side router. Each UI state (`idle`, `loading`, `error`, `weather`) is a pure function that writes directly to `innerHTML`. This is intentional — the app has exactly one screen and one interaction, so a framework would only add weight.

---

## Design: Neubrutalism

Neubrutalism rejects the softness of modern UI (gradients, blurs, rounded corners, drop shadows) in favour of rawness and honesty:

- **Borders** — every element has a solid `3px` black border, no exceptions
- **Hard shadows** — `box-shadow: 8px 8px 0 #000` with no blur; the offset creates a fake depth that's deliberately mechanical
- **Colour palette** — cream background (`#F5F0E8`) with a dot-grid texture, bright `#FFE500` yellow reserved as a single accent, high-contrast black on white for all readable content
- **Typography** — Space Grotesk at weight 900 for labels, all-caps with wide letter-spacing
- **Button interaction** — the GO button's shadow collapses on press (`translate + shadow: none`) giving a physical "stamp" feel
- **No border-radius** — sharp corners everywhere

### Trade-offs

- **innerHTML over a framework** — fast to write and zero bundle overhead, but means no diffing; the entire card re-renders on each search. For a single-screen app this is negligible.
- **Two API calls per search** — geocoding then weather adds a small sequential latency compared to an API that accepts city names directly (e.g. OpenWeatherMap). The trade-off is zero authentication complexity and no API key to manage or expire.
- **WMO code map is static** — the 23-entry lookup table covers all codes Open-Meteo actually returns. If Open-Meteo ever adds new codes the fallback renders `🌡️ / Unknown`, which is safe but imprecise.
- **No caching** — every search hits the network. A simple `Map<string, CurrentWeather>` keyed on lowercase city name would eliminate repeat calls during a session, but was left out to keep the code transparent.
- **Celsius only** — the app hardcodes metric units. A toggle would require re-fetching (or client-side conversion) and was out of scope.

---

## Getting Started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` and search for any city.

```bash
npm run build    # type-check + production bundle
npm run preview  # preview the production build locally
```

No `.env` file needed — there are no secrets.

---

## Deployment

The output of `npm run build` is a static `dist/` folder. Drop it on any static host:

- **Vercel** — `vercel --prod` or connect the GitHub repo and it auto-deploys on push
- **Netlify** — drag and drop `dist/` into the Netlify dashboard, or use `netlify deploy --prod --dir dist`
- **GitHub Pages** — push `dist/` to the `gh-pages` branch
