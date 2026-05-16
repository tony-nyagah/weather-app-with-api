import "./style.css";
import {
  getWeatherByCity,
  getWindDirection,
  getFlagEmoji,
  getHeaderColor,
  type CurrentWeather,
} from "./weather.ts";

// ─── App Shell ────────────────────────────────────────────────────────────────

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div class="min-h-screen px-4 py-12">
  <div class="mx-auto w-full max-w-[420px]">

    <!-- Header -->
    <header class="text-center mb-10">
      <div class="inline-block border-[3px] border-black bg-[#FFE500] px-8 py-3 shadow-[6px_6px_0_#000] mb-3">
        <h1 class="text-4xl font-black uppercase tracking-tight leading-none">⛅ WEATHER</h1>
      </div>
      <p class="text-[11px] font-black text-black/40 uppercase tracking-[0.25em]">Real-time global weather</p>
    </header>

    <!-- Search Form -->
    <form id="search-form" class="flex mb-7">
      <input
        id="search-input"
        type="text"
        placeholder="ENTER CITY NAME..."
        autocomplete="off"
        autofocus
        class="flex-1 min-w-0 border-[3px] border-r-0 border-black bg-white px-4 py-3 font-bold text-black uppercase tracking-wide placeholder:text-black/30 outline-none focus:bg-[#FFFBEF] text-sm"
      />
      <button
        id="search-btn"
        type="submit"
        class="border-[3px] border-black bg-black text-white px-6 py-3 font-black uppercase tracking-wider text-sm shadow-[4px_4px_0_#FFE500] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
      >
        GO →
      </button>
    </form>

    <!-- Dynamic Content -->
    <div id="state-container"></div>

  </div>
</div>
`;

// ─── DOM References ───────────────────────────────────────────────────────────

const form = document.getElementById("search-form") as HTMLFormElement;
const input = document.getElementById("search-input") as HTMLInputElement;
const searchBtn = document.getElementById("search-btn") as HTMLButtonElement;
const container = document.getElementById("state-container")!;

// ─── Renderers ────────────────────────────────────────────────────────────────

function renderIdle(): void {
  container.innerHTML = `
    <div class="border-[3px] border-black bg-white shadow-[6px_6px_0_#000] p-10 flex flex-col items-center gap-4 text-center">
      <div class="text-6xl select-none">🌍</div>
      <div>
        <p class="font-black uppercase tracking-widest text-sm mb-1">START SEARCHING</p>
        <p class="text-xs font-bold text-black/30 uppercase tracking-wide leading-relaxed">
          Type any city name above<br>and hit GO to see the weather
        </p>
      </div>
    </div>
  `;
}

function renderLoading(): void {
  container.innerHTML = `
    <div class="border-[3px] border-black bg-white shadow-[6px_6px_0_#000] p-10 flex flex-col items-center gap-6">
      <div class="flex items-end gap-2 h-10">
        <div class="w-4 h-4 bg-black"        style="animation: bounce-block 0.7s ease-in-out infinite; animation-delay: 0ms"></div>
        <div class="w-4 h-4 bg-[#FFE500] border-[2px] border-black" style="animation: bounce-block 0.7s ease-in-out infinite; animation-delay: 140ms"></div>
        <div class="w-4 h-4 bg-black"        style="animation: bounce-block 0.7s ease-in-out infinite; animation-delay: 280ms"></div>
      </div>
      <p class="font-black uppercase tracking-[0.2em] text-sm">FETCHING WEATHER...</p>
    </div>
  `;
}

function renderError(message: string): void {
  container.innerHTML = `
    <div class="border-[3px] border-black bg-[#FF5C5C] shadow-[6px_6px_0_#000] p-5 flex items-start gap-4">
      <span class="text-2xl shrink-0 mt-0.5 select-none">⚠️</span>
      <div>
        <p class="font-black uppercase text-sm tracking-widest mb-1">ERROR</p>
        <p class="font-bold text-sm leading-snug">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

function renderWeather(w: CurrentWeather): void {
  const flag = getFlagEmoji(w.countryCode);
  const windDir = getWindDirection(w.windDirection);
  const region = w.region ? `${w.region}, ${w.country}` : w.country;
  const headerBg = getHeaderColor(w.conditionCode);
  const updated = w.updatedAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  container.innerHTML = `
    <div class="border-[3px] border-black bg-white shadow-[8px_8px_0_#000]">

      <!-- Header: city + flag, colored by weather -->
      <div class="border-b-[3px] border-black p-5 flex items-start justify-between" style="background-color:${headerBg}">
        <div>
          <h2 class="text-2xl font-black uppercase leading-tight text-black">${escapeHtml(w.city)}</h2>
          <p class="text-xs font-black uppercase tracking-wide text-black/60 mt-0.5">${escapeHtml(region)}</p>
        </div>
        <span class="text-4xl leading-none mt-0.5 select-none" aria-label="${escapeHtml(w.country)}">${flag}</span>
      </div>

      <!-- Temperature + icon -->
      <div class="px-6 py-7 flex items-center justify-between gap-4">
        <div class="min-w-0">
          <div class="font-black leading-none" style="color:#000; font-size: clamp(3.5rem, 16vw, 5rem)">
            ${w.temperature}°<span style="font-size: 0.5em">C</span>
          </div>
          <div class="mt-3 inline-block border-[2px] border-black bg-black text-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.15em]">
            ${escapeHtml(w.condition)}
          </div>
        </div>
        <div class="text-[5rem] leading-none select-none shrink-0" role="img" aria-label="${escapeHtml(w.condition)}">
          ${w.icon}
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-3 border-t-[3px] border-black">

        <div class="p-4 text-center border-r-[3px] border-black bg-[#C8F7C5]">
          <div class="text-2xl mb-1 select-none">🌡️</div>
          <div class="text-xl font-black leading-tight text-black">${w.feelsLike}°C</div>
          <div class="text-[10px] font-black uppercase tracking-widest text-black/50 mt-1">FEELS LIKE</div>
        </div>

        <div class="p-4 text-center border-r-[3px] border-black bg-[#B8F1FF]">
          <div class="text-2xl mb-1 select-none">💧</div>
          <div class="text-xl font-black leading-tight text-black">${w.humidity}%</div>
          <div class="text-[10px] font-black uppercase tracking-widest text-black/50 mt-1">HUMIDITY</div>
        </div>

        <div class="p-4 text-center bg-[#FFC34D] border-black">
          <div class="text-2xl mb-1 select-none">💨</div>
          <div class="text-xl font-black leading-tight text-black">${w.windSpeed}<span class="text-xs"> km/h</span></div>
          <div class="text-[10px] font-black uppercase tracking-widest text-black/50 mt-1">${escapeHtml(windDir)}</div>
        </div>

      </div>

      <!-- Footer -->
      <div class="border-t-[3px] border-black bg-black px-4 py-2 flex items-center justify-between">
        <p class="text-[11px] font-black text-white/40 uppercase tracking-widest">
          UPDATED ${escapeHtml(updated)}
        </p>
        <p class="text-[11px] font-black text-white/25 uppercase tracking-widest">OPEN-METEO</p>
      </div>

    </div>
  `;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ─── Events ───────────────────────────────────────────────────────────────────

form.addEventListener("submit", async (e: Event) => {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) return;

  searchBtn.disabled = true;
  renderLoading();

  try {
    const weather = await getWeatherByCity(city);
    renderWeather(weather);
  } catch (err) {
    renderError(
      err instanceof Error ? err.message : "An unexpected error occurred.",
    );
  } finally {
    searchBtn.disabled = false;
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

renderIdle();
