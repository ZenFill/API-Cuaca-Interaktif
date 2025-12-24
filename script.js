// =============================================================
//              KONFIGURASI API (GANTI DENGAN KEY ASLI ANDA)
// =============================================================
const API_KEY = "bd21b06342623e36c1e175bf9268d88b";
const CURRENT_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const TRANSITION_DURATION = 400;
// =============================================================

let currentUnit = "metric";
let currentWeatherData = null;

// Mendapatkan elemen DOM
const elements = {
  cityInput: document.getElementById("city-input"),
  searchButton: document.getElementById("search-button"),
  weatherDataDiv: document.getElementById("current-weather-data"),
  errorMsgDiv: document.getElementById("error-message"),
  forecastContainer: document.getElementById("forecast-container"),
  forecastHeader: document.getElementById("forecast-header"),
  celsiusBtn: document.getElementById("celsius-btn"),
  fahrenheitBtn: document.getElementById("fahrenheit-btn"),
  locationName: document.getElementById("location-name"),
  currentTemp: document.getElementById("current-temp"),
  weatherDesc: document.getElementById("weather-description"),
  feelsLike: document.getElementById("feels-like"),
  humidity: document.getElementById("humidity"),
  windSpeed: document.getElementById("wind-speed"),
  pressure: document.getElementById("pressure"),
  weatherIcon: document.getElementById("weather-icon"),
  minTemp: document.getElementById("min-temp"),
  maxTemp: document.getElementById("max-temp"),
};

// --- FUNGSI UTILITY BARU: Mengelola Status Tombol ---
function toggleUnitButtons(enable) {
  elements.celsiusBtn.disabled = !enable;
  elements.fahrenheitBtn.disabled = !enable;
}

// --- FUNGSI TEMA DINAMIS ---
function updateBackground(condition) {
  const body = document.body;
  let newGradient;
  const conditionLower = condition.toLowerCase();

  // Skema Warna COOL TONES / DARK MODE
  if (conditionLower.includes("clear")) {
    newGradient = "linear-gradient(135deg, #00BFFF 0%, #1E90FF 100%)";
  } else if (
    conditionLower.includes("cloud") ||
    conditionLower.includes("overcast")
  ) {
    newGradient = "linear-gradient(135deg, #6C7A89 0%, #95A5A6 100%)";
  } else if (
    conditionLower.includes("rain") ||
    conditionLower.includes("drizzle")
  ) {
    newGradient = "linear-gradient(135deg, #34495E 0%, #5D6D7E 100%)";
  } else if (
    conditionLower.includes("snow") ||
    conditionLower.includes("sleet")
  ) {
    newGradient = "linear-gradient(135deg, #D4E6F1 0%, #EAEFF2 100%)";
  } else if (conditionLower.includes("thunderstorm")) {
    newGradient = "linear-gradient(135deg, #1C2833 0%, #2E4053 100%)";
  } else if (
    conditionLower.includes("mist") ||
    conditionLower.includes("fog")
  ) {
    newGradient = "linear-gradient(135deg, #E0E0E0 0%, #F5F5F5 100%)";
  } else {
    newGradient = "linear-gradient(135deg, #2C3E50 0%, #4A637D 100%)";
  }
  body.style.background = newGradient;
}

// --- FUNGSI UTAMA PENGAMBIL DATA (FINAL FIX) ---
async function fetchAndAnimateData(query) {
  if (!query) {
    displayError("Silakan masukkan nama kota.");
    return;
  }

  // **TINDAKAN KRITIS:** Nonaktifkan tombol saat fetch dimulai (anti-bug)
  toggleUnitButtons(false);

  // 1. Inisiasi Fade-Out dan Reset Visual
  elements.errorMsgDiv.classList.add("hidden");
  elements.weatherDataDiv.classList.add("fade-out");
  elements.forecastContainer.classList.add("fade-out");
  elements.forecastHeader.classList.add("fade-out");

  // 2. Lakukan Fetch API secara Asinkron
  const unitParam = currentUnit === "metric" ? "metric" : "imperial";

  let currentWeatherApi;
  if (typeof query === "object" && query.lat && query.lon) {
    currentWeatherApi = `${CURRENT_WEATHER_URL}?lat=${query.lat}&lon=${query.lon}&appid=${API_KEY}&units=${unitParam}&lang=id`;
  } else {
    currentWeatherApi = `${CURRENT_WEATHER_URL}?q=${query}&appid=${API_KEY}&units=${unitParam}&lang=id`;
  }

  let dataLoaded = null;
  let forecastDataLoaded = null;
  let errorOccurred = null;

  try {
    const response = await fetch(currentWeatherApi);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Gagal mengambil data: Status ${response.status}`
      );
    }
    dataLoaded = await response.json();

    const lat = dataLoaded.coord.lat;
    const lon = dataLoaded.coord.lon;

    const forecastApi = `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unitParam}`;
    const forecastResponse = await fetch(forecastApi);
    if (!forecastResponse.ok) {
      throw new Error(
        `Gagal mengambil perkiraan: Status ${forecastResponse.status}`
      );
    }
    forecastDataLoaded = await forecastResponse.json();
  } catch (error) {
    errorOccurred = error;
  }

  // 3. Tunggu transisi lama (fade-out) selesai
  setTimeout(() => {
    // Hapus kelas fade-out
    elements.weatherDataDiv.classList.remove("fade-out");
    elements.forecastContainer.classList.remove("fade-out");
    elements.forecastHeader.classList.remove("fade-out");

    if (errorOccurred) {
      currentWeatherData = null; // Reset state global data

      elements.weatherDataDiv.classList.add("hidden");
      elements.forecastContainer.classList.add("hidden");
      elements.forecastHeader.classList.add("hidden");
      displayError(`Pencarian gagal: ${errorOccurred.message}.`);
    } else {
      // Jika SUKSES, tampilkan data baru dan aktifkan tombol
      displayCurrentWeather(dataLoaded);
      processAndDisplayForecast(forecastDataLoaded);
      toggleUnitButtons(true);
    }
  }, TRANSITION_DURATION);
}

// --- FUNGSI DISPLAY ---
function displayCurrentWeather(data) {
  const unitSymbol = currentUnit === "metric" ? "°C" : "°F";
  const speedUnit = currentUnit === "metric" ? " m/s" : " mph";

  currentWeatherData = data;

  elements.locationName.textContent = `${data.name}, ${data.sys.country}`;
  elements.currentTemp.textContent = Math.round(data.main.temp);
  document.querySelector(".unit-symbol").textContent = unitSymbol;
  elements.weatherDesc.textContent = data.weather[0].description;
  elements.feelsLike.textContent = `${Math.round(
    data.main.feels_like
  )}${unitSymbol}`;
  elements.humidity.textContent = `${data.main.humidity}%`;
  elements.windSpeed.textContent = `${data.wind.speed}${speedUnit}`;
  elements.pressure.textContent = `${data.main.pressure} hPa`;
  elements.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  elements.minTemp.textContent = `${Math.round(
    data.main.temp_min
  )}${unitSymbol}`;
  elements.maxTemp.textContent = `${Math.round(
    data.main.temp_max
  )}${unitSymbol}`;

  updateBackground(data.weather[0].main);

  elements.weatherDataDiv.classList.remove("hidden");
}

function processAndDisplayForecast(data) {
  elements.forecastContainer.innerHTML = "";
  const dailyForecasts = {};
  const unitSymbol = currentUnit === "metric" ? "°C" : "°F";

  data.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = { temps: [], icons: [] };
    }
    dailyForecasts[date].temps.push(item.main.temp_min, item.main.temp_max);

    if (item.dt_txt.includes("12:00:00") || item.dt_txt.includes("15:00:00")) {
      dailyForecasts[date].icon = item.weather[0].icon;
      dailyForecasts[date].description = item.weather[0].description;
    }
  });

  Object.keys(dailyForecasts)
    .slice(1, 6)
    .forEach((dateStr) => {
      const temps = dailyForecasts[dateStr].temps;
      const minTemp = Math.round(Math.min(...temps));
      const maxTemp = Math.round(Math.max(...temps));
      const iconCode =
        dailyForecasts[dateStr].icon || data.list[0].weather[0].icon;

      const date = new Date(dateStr);
      const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });

      const html = `
            <div class="forecast-card">
                <div class="forecast-date">${dayName}</div>
                <img class="forecast-icon" src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${
        dailyForecasts[dateStr].description || ""
      }">
                <div class="forecast-temp">
                    ${maxTemp}${unitSymbol} / ${minTemp}${unitSymbol}
                </div>
            </div>
        `;
      elements.forecastContainer.insertAdjacentHTML("beforeend", html);
    });

  elements.forecastContainer.classList.remove("hidden");
  elements.forecastHeader.classList.remove("hidden");
}

// --- FUNGSI UTILITY & EVENT LISTENER ---

function displayError(message) {
  elements.errorMsgDiv.textContent = message;
  elements.errorMsgDiv.classList.remove("hidden");

  elements.weatherDataDiv.classList.add("hidden");
  elements.forecastContainer.classList.add("hidden");
  elements.forecastHeader.classList.add("hidden");

  updateBackground("");
}

function updateDisplayUnits(newUnit) {
  if (newUnit === currentUnit) return;

  // Ambil nama kota dari global state (yang terakhir sukses)
  const cityToFetch = currentWeatherData
    ? currentWeatherData.name
    : elements.cityInput.value.trim();

  if (!cityToFetch) {
    displayError("Silakan masukkan nama kota.");
    return;
  }

  currentUnit = newUnit;

  elements.celsiusBtn.classList.toggle("active", newUnit === "metric");
  elements.fahrenheitBtn.classList.toggle("active", newUnit === "imperial");

  fetchAndAnimateData(cityToFetch);
}

// Event Listeners
elements.searchButton.addEventListener("click", () => {
  fetchAndAnimateData(elements.cityInput.value.trim());
});
elements.cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    fetchAndAnimateData(elements.cityInput.value.trim());
  }
});
elements.celsiusBtn.addEventListener("click", () =>
  updateDisplayUnits("metric")
);
elements.fahrenheitBtn.addEventListener("click", () =>
  updateDisplayUnits("imperial")
);

// Panggil fungsi saat halaman pertama kali dimuat
fetchAndAnimateData(elements.cityInput.value);
