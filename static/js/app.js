async function getWeather(cityName) {
  const city = cityName.trim();
  const status = document.querySelector('#status');
  const button = document.querySelector('#get-weather');

  if (!city) {
    if (status) status.textContent = 'Enter a city name before searching.';
    return;
  }

  if (status) status.textContent = `Loading weather for ${city}...`;
  if (button) button.disabled = true;

  try {
    const response = await fetch(`/weather?city=${encodeURIComponent(city)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Unable to load weather data.');
    }

    const weather = data.current || data.weather || data;
    const location = data.location || {};
    applyWeatherTheme(weather.weather_code, weather.is_day);

    document.querySelector('#location-name').textContent = location.name || city;
    document.querySelector('#temperature').textContent = Math.round(weather.temperature ?? weather.temperature_2m ?? 0);
    document.querySelector('#condition').textContent = weather.condition || weather.description || 'Conditions unavailable';
    document.querySelector('#feels-like').textContent = `${Math.round(weather.feels_like ?? weather.apparent_temperature ?? 0)}°C`;
    document.querySelector('#humidity').textContent = `${weather.humidity ?? weather.relative_humidity_2m ?? '--'}%`;
    document.querySelector('#wind').textContent = `${Math.round(weather.wind_speed ?? weather.wind_speed_10m ?? 0)} km/h`;

    if (status) {
      status.textContent = `Weather updated for ${location.name || city}.`;
      status.classList.remove('error');
    }
  } catch (error) {
    if (status) status.textContent = error.message;
    document.querySelector('#status')?.classList.add('error');
  } finally {
    if (button) button.disabled = false;
  }
}

window.getWeather = getWeather;

function applyWeatherTheme(weatherCode, isDay = 1) {
  const body = document.body;
  const themeClasses = ['theme-clear', 'theme-cloudy', 'theme-rain', 'theme-snow', 'theme-storm', 'theme-night'];
  body.classList.remove(...themeClasses);

  if (!Number(isDay)) {
    body.classList.add('theme-night');
    return;
  }

  if (weatherCode >= 95) body.classList.add('theme-storm');
  else if (weatherCode >= 71 && weatherCode <= 77) body.classList.add('theme-snow');
  else if (weatherCode >= 51 && weatherCode <= 82) body.classList.add('theme-rain');
  else if (weatherCode >= 1 && weatherCode <= 3) body.classList.add('theme-cloudy');
  else body.classList.add('theme-clear');
}
