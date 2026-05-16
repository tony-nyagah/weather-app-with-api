// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeoLocation {
  name: string;
  country: string;
  countryCode: string;
  region?: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  city: string;
  country: string;
  countryCode: string;
  region?: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  icon: string;
  updatedAt: Date;
}

// ─── WMO Code Mapping ─────────────────────────────────────────────────────────

const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear Sky", icon: "☀️" },
  1: { description: "Mainly Clear", icon: "🌤️" },
  2: { description: "Partly Cloudy", icon: "⛅" },
  3: { description: "Overcast", icon: "☁️" },
  45: { description: "Foggy", icon: "🌫️" },
  48: { description: "Rime Fog", icon: "🌫️" },
  51: { description: "Light Drizzle", icon: "🌦️" },
  53: { description: "Moderate Drizzle", icon: "🌦️" },
  55: { description: "Dense Drizzle", icon: "🌧️" },
  61: { description: "Slight Rain", icon: "🌧️" },
  63: { description: "Moderate Rain", icon: "🌧️" },
  65: { description: "Heavy Rain", icon: "🌧️" },
  71: { description: "Slight Snowfall", icon: "🌨️" },
  73: { description: "Moderate Snowfall", icon: "🌨️" },
  75: { description: "Heavy Snowfall", icon: "❄️" },
  77: { description: "Snow Grains", icon: "❄️" },
  80: { description: "Slight Showers", icon: "🌦️" },
  81: { description: "Moderate Showers", icon: "🌧️" },
  82: { description: "Violent Showers", icon: "⛈️" },
  85: { description: "Slight Snow Showers", icon: "🌨️" },
  86: { description: "Heavy Snow Showers", icon: "🌨️" },
  95: { description: "Thunderstorm", icon: "⛈️" },
  96: { description: "Thunderstorm with Hail", icon: "⛈️" },
  99: { description: "Thunderstorm Heavy Hail", icon: "⛈️" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getWindDirection(degrees: number): string {
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return dirs[Math.round(degrees / 22.5) % 16];
}

export function getFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

/** Returns a bright flat hex color for the card header based on weather code. */
export function getHeaderColor(code: number): string {
  if (code <= 1) return "#FFE500"; // clear – yellow
  if (code <= 3) return "#E0E0E0"; // cloudy – gray
  if (code <= 48) return "#D6EAF8"; // fog – pale blue
  if (code <= 67) return "#AED6F1"; // rain – blue
  if (code <= 77) return "#D6EAF8"; // snow – ice blue
  if (code <= 82) return "#85C1E9"; // heavy showers – darker blue
  return "#F5CBA7"; // thunderstorm – orange
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function geocodeCity(city: string): Promise<GeoLocation> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error("Geocoding service unavailable. Please try again.");

  const data = (await res.json()) as {
    results?: Array<{
      name: string;
      country: string;
      country_code: string;
      admin1?: string;
      latitude: number;
      longitude: number;
    }>;
  };

  if (!data.results?.length) {
    throw new Error(
      `City "${city}" not found. Check the spelling and try again.`,
    );
  }

  const r = data.results[0];
  return {
    name: r.name,
    country: r.country,
    countryCode: r.country_code,
    region: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  };
}

async function fetchCurrentWeather(loc: GeoLocation): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: loc.latitude.toString(),
    longitude: loc.longitude.toString(),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
    wind_speed_unit: "kmh",
    timezone: "auto",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok)
    throw new Error("Weather service unavailable. Please try again.");

  const data = (await res.json()) as {
    current: {
      temperature_2m: number;
      relative_humidity_2m: number;
      apparent_temperature: number;
      weather_code: number;
      wind_speed_10m: number;
      wind_direction_10m: number;
    };
  };

  const c = data.current;
  const code = c.weather_code;
  const wmo = WMO_CODES[code] ?? { description: "Unknown", icon: "🌡️" };

  return {
    city: loc.name,
    country: loc.country,
    countryCode: loc.countryCode,
    region: loc.region,
    temperature: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    condition: wmo.description,
    conditionCode: code,
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),
    windDirection: c.wind_direction_10m,
    icon: wmo.icon,
    updatedAt: new Date(),
  };
}

export async function getWeatherByCity(city: string): Promise<CurrentWeather> {
  const location = await geocodeCity(city);
  return fetchCurrentWeather(location);
}
