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
    applyWeatherTheme(weather.weather_code, weather.is_day, weather.temperature ?? weather.temperature_2m ?? null);

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

function applyWeatherTheme(weatherCode, isDay = 1, temperature = null) {
  const body = document.body;
  const themeClasses = ['theme-clear', 'theme-cloudy', 'theme-rain', 'theme-snow', 'theme-storm', 'theme-night', 'theme-hot'];
  body.classList.remove(...themeClasses);

  let theme;
  if (!Number(isDay)) {
    theme = 'theme-night';
  } else if (weatherCode >= 95) {
    theme = 'theme-storm';
  } else if (weatherCode >= 71 && weatherCode <= 77) {
    theme = 'theme-snow';
  } else if (weatherCode >= 51 && weatherCode <= 82) {
    theme = 'theme-rain';
  } else if (weatherCode >= 1 && weatherCode <= 3) {
    theme = 'theme-cloudy';
  } else if (temperature !== null && temperature >= 30) {
    theme = 'theme-hot';
  } else {
    theme = 'theme-clear';
  }

  body.classList.add(theme);
  startWeatherAnimation(theme);
}

/* ── Canvas-based weather particle animations ── */
let _animFrame = null;
let _particles = [];
let _resizeHandler = null;

function startWeatherAnimation(theme) {
  if (_animFrame !== null) {
    cancelAnimationFrame(_animFrame);
    _animFrame = null;
  }
  _particles = [];

  if (_resizeHandler !== null) {
    window.removeEventListener('resize', _resizeHandler);
    _resizeHandler = null;
  }

  let canvas = document.getElementById('weather-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'weather-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
  }

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  _resizeHandler = resize;
  window.addEventListener('resize', _resizeHandler, { passive: true });

  if (theme === 'theme-rain' || theme === 'theme-storm') {
    _particles = Array.from({ length: theme === 'theme-storm' ? 220 : 150 }, () => createRaindrop(canvas));
    _animFrame = requestAnimationFrame(function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const speed = theme === 'theme-storm' ? 1.8 : 1;
      for (const p of _particles) {
        ctx.save();
        ctx.strokeStyle = `rgba(140,200,220,${p.opacity})`;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.dx * p.len, p.y + p.len);
        ctx.stroke();
        ctx.restore();
        p.y += p.speed * speed;
        p.x += p.dx * p.speed * speed * 0.18;
        if (p.y > canvas.height + p.len) {
          Object.assign(p, createRaindrop(canvas));
          p.y = -p.len;
        }
      }
      _animFrame = requestAnimationFrame(loop);
    });
  } else if (theme === 'theme-snow') {
    _particles = Array.from({ length: 120 }, () => createSnowflake(canvas));
    _animFrame = requestAnimationFrame(function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of _particles) {
        ctx.save();
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        p.y += p.speed;
        p.x += Math.sin(p.swing + p.y * 0.012) * 0.6;
        if (p.y > canvas.height + p.r) {
          Object.assign(p, createSnowflake(canvas));
          p.y = -p.r;
        }
      }
      _animFrame = requestAnimationFrame(loop);
    });
  } else if (theme === 'theme-hot') {
    _particles = Array.from({ length: 18 }, () => createHeatWave(canvas));
    _animFrame = requestAnimationFrame(function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of _particles) {
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
        grad.addColorStop(0, `rgba(255,140,0,0)`);
        grad.addColorStop(0.5, `rgba(255,100,0,${p.opacity})`);
        grad.addColorStop(1, `rgba(255,140,0,0)`);
        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.x + Math.sin(p.phase) * 10, p.y, p.w, p.h, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        p.y -= p.speed;
        p.phase += 0.04;
        p.opacity = 0.04 + 0.03 * Math.abs(Math.sin(p.phase));
        if (p.y < -p.h) {
          Object.assign(p, createHeatWave(canvas));
          p.y = canvas.height + p.h;
        }
      }
      _animFrame = requestAnimationFrame(loop);
    });
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function createRaindrop(canvas) {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    len: 14 + Math.random() * 20,
    speed: 8 + Math.random() * 10,
    dx: -0.3 + Math.random() * 0.6,
    opacity: 0.25 + Math.random() * 0.45,
    width: 0.8 + Math.random() * 0.8,
  };
}

function createSnowflake(canvas) {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: 2 + Math.random() * 4,
    speed: 0.8 + Math.random() * 1.6,
    swing: Math.random() * Math.PI * 2,
    opacity: 0.4 + Math.random() * 0.5,
  };
}

function createHeatWave(canvas) {
  return {
    x: 60 + Math.random() * (canvas.width - 120),
    y: canvas.height * (0.5 + Math.random() * 0.5),
    w: 20 + Math.random() * 50,
    h: 80 + Math.random() * 140,
    speed: 0.4 + Math.random() * 0.7,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.04 + Math.random() * 0.04,
  };
}
