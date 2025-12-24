/**
 * KONFIGURASI DAN KONSTANTA APLIKASI
 */
const CONFIG = {
  API_KEY: "bd21b06342623e36c1e175bf9268d88b",
  BASE_URL: {
    CURRENT: "https://api.openweathermap.org/data/2.5/weather",
    FORECAST: "https://api.openweathermap.org/data/2.5/forecast",
  },
  ANIMATION_DURATION: 400,
  TEMP_THRESHOLDS: {
    HOT: 30,
    WARM: 20,
    COOL: 10,
  },
};

const UI_CLASSES = {
  HIDDEN: "hidden",
  FADE_OUT: "fade-out",
  ACTIVE: "active",
};

/**
 * STATE MANAGEMENT
 */
let state = {
  unit: "metric", // 'metric' or 'imperial'
  currentData: null,
};

/**
 * SELEKTOR DOM
 */
const dom = {
  inputs: {
    city: document.getElementById("city-input"),
    searchBtn: document.getElementById("search-button"),
    celsiusBtn: document.getElementById("celsius-btn"),
    fahrenheitBtn: document.getElementById("fahrenheit-btn"),
  },
  containers: {
    weatherData: document.getElementById("current-weather-data"),
    forecast: document.getElementById("forecast-container"),
    forecastHeader: document.getElementById("forecast-header"),
    errorMsg: document.getElementById("error-message"),
    unitSymbol: document.querySelector(".unit-symbol"),
  },
  weatherInfo: {
    location: document.getElementById("location-name"),
    temp: document.getElementById("current-temp"),
    desc: document.getElementById("weather-description"),
    feelsLike: document.getElementById("feels-like"),
    humidity: document.getElementById("humidity"),
    wind: document.getElementById("wind-speed"),
    pressure: document.getElementById("pressure"),
    icon: document.getElementById("weather-icon"),
    minTemp: document.getElementById("min-temp"),
    maxTemp: document.getElementById("max-temp"),
  },
};

// --- HELPER FUNCTIONS ---

function toggleInputState(enabled) {
  dom.inputs.celsiusBtn.disabled = !enabled;
  dom.inputs.fahrenheitBtn.disabled = !enabled;
  dom.inputs.searchBtn.disabled = !enabled;
  dom.inputs.city.disabled = !enabled;
}

function getUnitParams() {
  return {
    param: state.unit === "metric" ? "metric" : "imperial",
    symbol: state.unit === "metric" ? "°C" : "°F",
    speed: state.unit === "metric" ? " m/s" : " mph",
  };
}

function convertToCelsius(temp) {
  if (state.unit === "metric") return temp;
  return ((temp - 32) * 5) / 9;
}

/**
 * MENGATUR TEMA LATAR BELAKANG
 * Mengubah gradient CSS berdasarkan suhu yang dinormalisasi ke Celcius.
 */
function updateThemeByTemperature(temp) {
  if (temp === null || temp === undefined) {
    document.body.style.background =
      "linear-gradient(135deg, #2c3e50 0%, #4a637d 100%)";
    return;
  }

  const tempC = convertToCelsius(temp);
  const { HOT, WARM, COOL } = CONFIG.TEMP_THRESHOLDS;
  let gradient;

  if (tempC >= HOT) {
    gradient = "linear-gradient(135deg, #FF4E50 0%, #F9D423 100%)"; // Panas (Merah-Kuning)
  } else if (tempC >= WARM) {
    gradient = "linear-gradient(135deg, #2980B9 0%, #F4D03F 100%)"; // Hangat (Biru-Emas)
  } else if (tempC >= COOL) {
    gradient = "linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)"; // Sejuk (Biru Langit)
  } else {
    gradient = "linear-gradient(135deg, #83a4d4 0%, #b6fbff 100%)"; // Dingin (Biru Es)
  }

  document.body.style.background = gradient;
}

// --- LOGIKA UTAMA (API FETCH) ---

async function fetchWeatherData(query) {
  if (!query) {
    showError("Silakan masukkan nama kota.");
    return;
  }

  toggleInputState(false);
  startTransitionAnimation();

  const unitParam = getUnitParams().param;

  // Construct URL
  const queryParam =
    typeof query === "object"
      ? `lat=${query.lat}&lon=${query.lon}`
      : `q=${query}`;

  const weatherUrl = `${CONFIG.BASE_URL.CURRENT}?${queryParam}&appid=${CONFIG.API_KEY}&units=${unitParam}&lang=id`;

  try {
    // 1. Fetch Current Weather
    const response = await fetch(weatherUrl);
    if (!response.ok) throw new Error("Kota tidak ditemukan.");
    const currentData = await response.json();

    // 2. Fetch Forecast (using coords from first call for accuracy)
    const { lat, lon } = currentData.coord;
    const forecastUrl = `${CONFIG.BASE_URL.FORECAST}?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${unitParam}`;
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok)
      throw new Error("Gagal mengambil data perkiraan.");
    const forecastData = await forecastResponse.json();

    // 3. Handle Success after animation
    setTimeout(() => {
      handleFetchSuccess(currentData, forecastData);
    }, CONFIG.ANIMATION_DURATION);
  } catch (error) {
    setTimeout(() => {
      handleFetchError(error.message);
    }, CONFIG.ANIMATION_DURATION);
  }
}

function startTransitionAnimation() {
  dom.containers.errorMsg.classList.add(UI_CLASSES.HIDDEN);
  dom.containers.weatherData.classList.add(UI_CLASSES.FADE_OUT);
  dom.containers.forecast.classList.add(UI_CLASSES.FADE_OUT);
  dom.containers.forecastHeader.classList.add(UI_CLASSES.FADE_OUT);
}

function stopTransitionAnimation() {
  dom.containers.weatherData.classList.remove(UI_CLASSES.FADE_OUT);
  dom.containers.forecast.classList.remove(UI_CLASSES.FADE_OUT);
  dom.containers.forecastHeader.classList.remove(UI_CLASSES.FADE_OUT);
}

function handleFetchSuccess(currentData, forecastData) {
  stopTransitionAnimation();

  state.currentData = currentData;
  toggleInputState(true);

  renderCurrentWeather(currentData);
  renderForecast(forecastData);
}

function handleFetchError(message) {
  stopTransitionAnimation();
  state.currentData = null;
  toggleInputState(true);
  showError(`Pencarian gagal: ${message}`);
}

// --- RENDERING UI ---

function renderCurrentWeather(data) {
  const units = getUnitParams();

  // Update Text Content
  dom.weatherInfo.location.textContent = `${data.name}, ${data.sys.country}`;
  dom.weatherInfo.temp.textContent = Math.round(data.main.temp);
  dom.containers.unitSymbol.textContent = units.symbol;
  dom.weatherInfo.desc.textContent = data.weather[0].description;
  dom.weatherInfo.feelsLike.textContent = `${Math.round(data.main.feels_like)}${
    units.symbol
  }`;
  dom.weatherInfo.humidity.textContent = `${data.main.humidity}%`;
  dom.weatherInfo.wind.textContent = `${data.wind.speed}${units.speed}`;
  dom.weatherInfo.pressure.textContent = `${data.main.pressure} hPa`;
  dom.weatherInfo.minTemp.textContent = `${Math.round(data.main.temp_min)}${
    units.symbol
  }`;
  dom.weatherInfo.maxTemp.textContent = `${Math.round(data.main.temp_max)}${
    units.symbol
  }`;

  // Icon
  dom.weatherInfo.icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  // Theme & Visibility
  updateThemeByTemperature(data.main.temp);
  dom.containers.weatherData.classList.remove(UI_CLASSES.HIDDEN);
}

function renderForecast(data) {
  dom.containers.forecast.innerHTML = "";
  const units = getUnitParams();
  const dailyForecasts = {};

  // Filter: Ambil satu data per hari (approx jam 12:00)
  data.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyForecasts[date]) {
      // Init dengan data dummy/pertama
      dailyForecasts[date] = item;
      dailyForecasts[date].min = item.main.temp;
      dailyForecasts[date].max = item.main.temp;
    } else {
      // Cari min/max sesungguhnya hari itu
      dailyForecasts[date].min = Math.min(
        dailyForecasts[date].min,
        item.main.temp
      );
      dailyForecasts[date].max = Math.max(
        dailyForecasts[date].max,
        item.main.temp
      );

      // Prioritaskan ikon siang hari
      if (item.dt_txt.includes("12:00:00")) {
        dailyForecasts[date].weather = item.weather;
      }
    }
  });

  const forecastDays = Object.values(dailyForecasts).slice(1, 6); // Ambil 5 hari kedepan

  forecastDays.forEach((item) => {
    const date = new Date(item.dt_txt);
    const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });
    const minTemp = Math.round(item.min);
    const maxTemp = Math.round(item.max);

    const html = `
      <div class="forecast-card">
          <div class="forecast-date">${dayName}</div>
          <img class="forecast-icon" src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}">
          <div class="forecast-temp">
              ${maxTemp}${units.symbol} / ${minTemp}${units.symbol}
          </div>
      </div>
    `;
    dom.containers.forecast.insertAdjacentHTML("beforeend", html);
  });

  dom.containers.forecast.classList.remove(UI_CLASSES.HIDDEN);
  dom.containers.forecastHeader.classList.remove(UI_CLASSES.HIDDEN);
}

function showError(message) {
  dom.containers.errorMsg.textContent = message;
  dom.containers.errorMsg.classList.remove(UI_CLASSES.HIDDEN);

  dom.containers.weatherData.classList.add(UI_CLASSES.HIDDEN);
  dom.containers.forecast.classList.add(UI_CLASSES.HIDDEN);
  dom.containers.forecastHeader.classList.add(UI_CLASSES.HIDDEN);

  updateThemeByTemperature(null);
}

// --- EVENT HANDLERS ---

function changeUnit(newUnit) {
  if (state.unit === newUnit) return;

  state.unit = newUnit;
  dom.inputs.celsiusBtn.classList.toggle(
    UI_CLASSES.ACTIVE,
    newUnit === "metric"
  );
  dom.inputs.fahrenheitBtn.classList.toggle(
    UI_CLASSES.ACTIVE,
    newUnit === "imperial"
  );

  const cityQuery = state.currentData
    ? state.currentData.name
    : dom.inputs.city.value.trim();
  if (cityQuery) fetchWeatherData(cityQuery);
}

dom.inputs.searchBtn.addEventListener("click", () =>
  fetchWeatherData(dom.inputs.city.value.trim())
);
dom.inputs.city.addEventListener("keypress", (e) => {
  if (e.key === "Enter") fetchWeatherData(dom.inputs.city.value.trim());
});

dom.inputs.celsiusBtn.addEventListener("click", () => changeUnit("metric"));
dom.inputs.fahrenheitBtn.addEventListener("click", () =>
  changeUnit("imperial")
);

// --- INIT ---
fetchWeatherData(dom.inputs.city.value);
