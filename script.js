const WEATHER_API_KEY = "4779237dd236575a340fc21b59e6e6d3";
const AIR_QUALITY_API_KEY = "4779237dd236575a340fc21b59e6e6d3";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const searchBtn = document.getElementById("searchBtn");
const locationInput = document.getElementById("location");

searchBtn.addEventListener("click", fetchWeather);
locationInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") fetchWeather();
});

async function fetchWeather() {
  const location = locationInput.value || "Faridabad";
  try {
    const [weatherData, forecastData] = await Promise.all([
      fetchCurrentWeather(location),
      fetchForecast(location),
    ]);

    updateCurrentWeather(weatherData);
    updateForecast(forecastData.list);
    updateHourlyChart(forecastData.list.slice(0, 8));

    const airQualityData = await fetchAirQuality(weatherData.coord.lat, weatherData.coord.lon);
    updateAirQuality(airQualityData);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    alert("Failed to fetch weather data. Please try again.");
  }
}

async function fetchData(endpoint, params) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.search = new URLSearchParams({ ...params, appid: WEATHER_API_KEY, units: "metric" }).toString();

  const response = await fetch(url);
  if (!response.ok) throw new Error(`${endpoint} data not found`);
  return response.json();
}

const fetchCurrentWeather = (location) => fetchData("weather", { q: location });
const fetchForecast = (location) => fetchData("forecast", { q: location });
const fetchAirQuality = (lat, lon) => fetchData("air_pollution", { lat, lon });

function updateCurrentWeather(data) {
  const { name, sys, main, weather, wind } = data;
  const { temp, humidity, pressure } = main;
  const { speed } = wind;
  const [currentWeather] = weather;

  document.getElementById("city").textContent = `${name}, ${sys.country}`;
  document.getElementById("temperature").textContent = `${Math.round(temp)}°C`;
  document.getElementById("weather-condition").textContent = currentWeather.main;
  document.getElementById("description").textContent = currentWeather.description;
  document.getElementById("wind").textContent = `${speed} m/s`;
  document.getElementById("humidity").textContent = `${humidity}%`;
  document.getElementById("pressure").textContent = `${pressure} hPa`;

  const formatTime = (timestamp) => new Date(timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.getElementById("sunrise").textContent = formatTime(sys.sunrise);
  document.getElementById("sunset").textContent = formatTime(sys.sunset);

  const weatherIcon = document.getElementById("weather-icon");
  weatherIcon.src = `http://openweathermap.org/img/wn/${currentWeather.icon}@2x.png`;
  weatherIcon.alt = currentWeather.description;
}

function updateForecast(data) {
  const forecastContainer = document.querySelector(".forecast");
  forecastContainer.innerHTML = "";

  const dailyData = data.filter((_, index) => index % 6 === 0).slice(0, 8);

  dailyData.forEach((item) => {
    const { dt, main, weather } = item;
    const [currentWeather] = weather;

    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    dayDiv.innerHTML = `
      <p>${new Date(dt * 1000).toLocaleDateString("en-US", { weekday: "short" })}</p>
      <img src="http://openweathermap.org/img/wn/${currentWeather.icon}.png" alt="${currentWeather.description}" class="forecast-icon">
      <p>${Math.round(main.temp)}°C</p>
    `;
    forecastContainer.appendChild(dayDiv);
  });
}

function updateHourlyChart(data) {
  const ctx = document.getElementById("hourlyChart").getContext("2d");
  const labels = data.map((item) => new Date(item.dt * 1000).toLocaleTimeString("en-US", { hour: "numeric" }));
  const temperatures = data.map((item) => item.main.temp);

  if (window.hourlyChart instanceof Chart) {
    window.hourlyChart.destroy();
  }

  window.hourlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: temperatures,
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.2)",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: false },
      },
    },
  });
}

function updateAirQuality(data) {
  const aqi = data.list[0].main.aqi;
  const airQualityElement = document.getElementById("air-quality");

  const airQualityLevels = {
    1: { text: "Good", class: "good" },
    2: { text: "Fair", class: "fair" },
    3: { text: "Moderate", class: "moderate" },
    4: { text: "Poor", class: "poor" },
    5: { text: "Very Poor", class: "very-poor" },
  };

  const { text: airQualityText, class: airQualityClass } = airQualityLevels[aqi] || { text: "Unknown", class: "" };

  airQualityElement.textContent = airQualityText;
  airQualityElement.className = `air-quality ${airQualityClass}`;
}

// Fetch default location weather on page load
fetchWeather();
