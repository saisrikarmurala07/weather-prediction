function updateClock() {
  document.getElementById('liveTime').textContent =
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
updateClock();
setInterval(updateClock, 1000);

function showLoader(v) {
  document.getElementById('loader').classList.toggle('active', v);
  document.getElementById('searchBtn').disabled = v;
}

function clearUI() {
  document.getElementById('errorBox').classList.remove('active');
  document.getElementById('weatherCard').classList.remove('active');
  document.getElementById('forecastSection').classList.remove('active');
  document.getElementById('aiNote').style.display = 'none';
}

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.classList.add('active');
}

function setBg(condition) {
  const c    = condition.toLowerCase();
  const body = document.body;

  if (c.includes('thunder') || c.includes('storm')) {
    body.style.background = 'var(--bg-thunder)';
  } else if (c.includes('rain') || c.includes('drizzle')) {
    body.style.background = 'var(--bg-rain)';
  } else if (c.includes('snow') || c.includes('sleet')) {
    body.style.background = 'var(--bg-snow)';
  } else if (c.includes('mist') || c.includes('fog') || c.includes('haze')) {
    body.style.background = 'var(--bg-mist)';
  } else if (c.includes('clear') || c.includes('sunny')) {
    body.style.background = 'var(--bg-clear)';
  } else if (c.includes('cloud') || c.includes('overcast')) {
    body.style.background = 'var(--bg-clouds)';
  } else {
    body.style.background = 'var(--bg-default)';
  }
}

async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) return;

  clearUI();
  showLoader(true);

  
  const prompt = `You are a weather data API. Return ONLY a JSON object (no markdown, no explanation) for the city: "${city}".

Use realistic, plausible weather data for that city based on its geography, climate, and the current season (it is currently mid-June 2026, so Southern Hemisphere is winter, Northern Hemisphere is summer).

If the city does not exist or is clearly invalid, return: {"error": "City not found"}

Otherwise return exactly this structure:
{
  "city": "Full City Name",
  "country": "Country Name",
  "temperature": 28,
  "feels_like": 31,
  "temp_min": 24,
  "temp_max": 33,
  "condition": "Partly Cloudy",
  "emoji": "⛅",
  "humidity": 72,
  "wind_speed": "14 km/h",
  "visibility": "8 km",
  "pressure": "1012 hPa",
  "sunrise": "05:58 AM",
  "sunset": "06:47 PM",
  "forecast": [
    { "day": "Mon", "emoji": "🌤", "high": 32, "low": 24 },
    { "day": "Tue", "emoji": "🌧", "high": 28, "low": 22 },
    { "day": "Wed", "emoji": "⛅", "high": 30, "low": 23 },
    { "day": "Thu", "emoji": "☀️", "high": 34, "low": 25 },
    { "day": "Fri", "emoji": "🌤", "high": 33, "low": 25 }
  ]
}

Rules:
- emoji must be one of: ☀️ 🌤 ⛅ ☁️ 🌧 ⛈ ❄️ 🌫 🌦
- temperature values are integers in Celsius
- wind_speed includes units
- all fields are required
- return ONLY the JSON, nothing else`;

  try {
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error('API request failed. Please try again.');
    }

    const data = await response.json();

    
    const rawText = data.content.find(block => block.type === 'text')?.text || '';

    
    const cleanText = rawText.replace(/```json|```/g, '').trim();

    
    const weatherData = JSON.parse(cleanText);

    
    if (weatherData.error) {
      showLoader(false);
      showError(`❌ ${weatherData.error} — check the city name and try again.`);
      return;
    }

    showLoader(false);
    renderWeather(weatherData);

  } catch (err) {
    showLoader(false);

    if (err instanceof SyntaxError) {
      showError('Unexpected response format. Please try again.');
    } else {
      showError(err.message || 'Something went wrong. Please try again.');
    }
  }
}

function renderWeather(w) {
  
  setBg(w.condition);

  
  document.getElementById('cityName').textContent    = w.city;
  document.getElementById('cityCountry').textContent = w.country;
  document.getElementById('cityDate').textContent    = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  
  document.getElementById('tempMain').innerHTML           = `${w.temperature}<sup>°C</sup>`;
  document.getElementById('weatherIconLarge').textContent = w.emoji;
  document.getElementById('conditionText').textContent    = w.condition;

  
  document.getElementById('humidity').textContent   = `${w.humidity}%`;
  document.getElementById('windSpeed').textContent  = w.wind_speed;
  document.getElementById('feelsLike').textContent  = `${w.feels_like}°C`;
  document.getElementById('visibility').textContent = w.visibility;

  
  document.getElementById('minMax').textContent   = `${w.temp_min}° / ${w.temp_max}°`;
  document.getElementById('pressure').textContent = w.pressure;
  document.getElementById('sunTimes').textContent = `${w.sunrise} / ${w.sunset}`;

  
  document.getElementById('weatherCard').classList.add('active');

  
  renderForecast(w.forecast);

  
  document.getElementById('aiNote').style.display = 'block';
}

function renderForecast(forecastArr) {
  const row = document.getElementById('forecastRow');

  row.innerHTML = forecastArr.map(function(day) {
    return `
      <div class="forecast-day">
        <div class="forecast-day-name">${day.day}</div>
        <div class="forecast-icon">${day.emoji}</div>
        <div class="forecast-temp-high">${day.high}°</div>
        <div class="forecast-temp-low">${day.low}°</div>
      </div>
    `;
  }).join('');

  document.getElementById('forecastSection').classList.add('active');
}

document.getElementById('cityInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') getWeather();
});

window.addEventListener('load', function() {
  document.getElementById('cityInput').value = 'Tirupati';
  getWeather();
});
