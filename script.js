// =============================================================
//              KONFIGURASI API (GANTI DI SINI)
// =============================================================
const API_KEY = "bd21b06342623e36c1e175bf9268d88b";
const CURRENT_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

// =============================================================

// Status Global untuk unit (default Celsius)
let currentUnit = "metric";
let currentWeatherData = null;

// Mendapatkan elemen DOM
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const weatherDataDiv = document.getElementById("current-weather-data");
const errorMsgDiv = document.getElementById("error-message");
const forecastContainer = document.getElementById("forecast-container");
const forecastHeader = document.getElementById("forecast-header");
const celsiusBtn = document.getElementById("celsius-btn");
const fahrenheitBtn = document.getElementById("fahrenheit-btn");

// Elemen Data Cuaca Saat Ini
const elements = {
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

// --- FUNGSI UTAMA PENGAMBIL DATA ---

async function fetchAllData(city) {
  if (!city) {
    displayError("Silakan masukkan nama kota.");
    return;
  }

  // Reset tampilan
  errorMsgDiv.classList.add("hidden");
  weatherDataDiv.classList.add("hidden");
  forecastContainer.classList.add("hidden");
  forecastHeader.classList.add("hidden");

  const unitParam = currentUnit === "metric" ? "metric" : "imperial";

  // 1. Panggil API Cuaca Saat Ini
  const currentWeatherApi = `${CURRENT_WEATHER_URL}?q=${city}&appid=${API_KEY}&units=${unitParam}&lang=id`;

  try {
    const response = await fetch(currentWeatherApi);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          `Gagal mengambil data cuaca saat ini: Status ${response.status}`
      );
    }
    currentWeatherData = await response.json();

    // 2. Tampilkan data cuaca saat ini
    displayCurrentWeather(currentWeatherData);

    // 3. Panggil API Perkiraan (menggunakan koordinat dari data saat ini)
    const lat = currentWeatherData.coord.lat;
    const lon = currentWeatherData.coord.lon;
    await fetchForecastData(lat, lon, unitParam);
  } catch (error) {
    displayError(`Pencarian gagal: ${error.message}.`);
    console.error("Error Detail:", error);
  }
}

// --- FUNGSI UNTUK DATA CUACA SAAT INI ---

function displayCurrentWeather(data) {
  const unitSymbol = currentUnit === "metric" ? "°C" : "°F";
  const speedUnit = currentUnit === "metric" ? " m/s" : " mph";

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

  // Min/Max suhu harian
  elements.minTemp.textContent = `${Math.round(
    data.main.temp_min
  )}${unitSymbol}`;
  elements.maxTemp.textContent = `${Math.round(
    data.main.temp_max
  )}${unitSymbol}`;

  weatherDataDiv.classList.remove("hidden");
}

// --- FUNGSI UNTUK PERKIRAAN 5 HARI ---

async function fetchForecastData(lat, lon, unitParam) {
  const forecastApi = `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unitParam}`;

  try {
    const response = await fetch(forecastApi);
    if (!response.ok) {
      throw new Error(`Gagal mengambil perkiraan: Status ${response.status}`);
    }
    const data = await response.json();

    processAndDisplayForecast(data);
  } catch (error) {
    console.error("Error mengambil forecast:", error);
  }
}

function processAndDisplayForecast(data) {
  forecastContainer.innerHTML = ""; // Bersihkan kontainer lama
  const dailyForecasts = {};
  const unitSymbol = currentUnit === "metric" ? "°C" : "°F";

  // Grupkan data per hari (API memberikan data per 3 jam)
  data.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0]; // Ambil tanggal saja (YYYY-MM-DD)
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = { temps: [], icons: [] };
    }
    dailyForecasts[date].temps.push(item.main.temp_min, item.main.temp_max);

    // Ambil icon pada waktu tengah hari (sekitar jam 12:00)
    if (item.dt_txt.includes("12:00:00") || item.dt_txt.includes("15:00:00")) {
      dailyForecasts[date].icon = item.weather[0].icon;
      dailyForecasts[date].description = item.weather[0].description;
    }
  });

  // Tampilkan 5 hari berikutnya (lewatkan hari ini)
  Object.keys(dailyForecasts)
    .slice(1, 6)
    .forEach((dateStr) => {
      const temps = dailyForecasts[dateStr].temps;
      const minTemp = Math.round(Math.min(...temps));
      const maxTemp = Math.round(Math.max(...temps));
      const iconCode =
        dailyForecasts[dateStr].icon || data.list[0].weather[0].icon; // Fallback icon

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
      forecastContainer.insertAdjacentHTML("beforeend", html);
    });

  forecastContainer.classList.remove("hidden");
  forecastHeader.classList.remove("hidden");
}

// --- FUNGSI UTILITY & EVENT LISTENER ---

function displayError(message) {
  errorMsgDiv.textContent = message;
  errorMsgDiv.classList.remove("hidden");
  weatherDataDiv.classList.add("hidden");
  forecastContainer.classList.add("hidden");
  forecastHeader.classList.add("hidden");
}

// Konversi Celsius ke Fahrenheit
function cToF(celsius) {
  return (celsius * 9) / 5 + 32;
}

// Menghandle perpindahan unit
function updateDisplayUnits(newUnit) {
  if (newUnit === currentUnit || !currentWeatherData) return;

  currentUnit = newUnit;

  // Perbarui tombol aktif
  celsiusBtn.classList.toggle("active", newUnit === "metric");
  fahrenheitBtn.classList.toggle("active", newUnit === "imperial");

  // Panggil ulang data (atau konversi jika data sudah ada)
  // Untuk kesederhanaan, kita panggil ulang seluruh data agar konsisten
  fetchAllData(currentWeatherData.name);
}

// Event Listeners
searchButton.addEventListener("click", () => {
  fetchAllData(cityInput.value.trim());
});

cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    fetchAllData(cityInput.value.trim());
  }
});

celsiusBtn.addEventListener("click", () => updateDisplayUnits("metric"));
fahrenheitBtn.addEventListener("click", () => updateDisplayUnits("imperial"));

// Panggil fungsi saat halaman pertama kali dimuat
fetchAllData(cityInput.value);
