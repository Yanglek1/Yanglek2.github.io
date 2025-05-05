// API Key for OpenWeatherMap - Replace with your own API key
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';

// DOM Elements
const locationElement = document.getElementById('location');
const dateElement = document.getElementById('date');
const weatherIcon = document.getElementById('weather-icon');
const temperatureElement = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const highTempElement = document.getElementById('high-temp');
const lowTempElement = document.getElementById('low-temp');
const hourlyContainer = document.getElementById('hourly-container');
const dailyContainer = document.getElementById('daily-container');
const sunriseElement = document.getElementById('sunrise');
const sunsetElement = document.getElementById('sunset');
const humidityElement = document.getElementById('humidity');
const windElement = document.getElementById('wind');
const feelsLikeElement = document.getElementById('feels-like');
const pressureElement = document.getElementById('pressure');

// Current date
function updateDate() {
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', options);
}

// Get weather icon based on OpenWeatherMap icon code
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud-meatball',
        '04n': 'fas fa-cloud-meatball',
        '09d': 'fas fa-cloud-rain',
        '09n': 'fas fa-cloud-rain',
        '10d': 'fas fa-cloud-sun-rain',
        '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };
    return iconMap[iconCode] || 'fas fa-cloud';
}

// Convert timestamp to time string
function formatTime(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Convert timestamp to hour string
function formatHour(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', hour12: true });
}

// Convert timestamp to day string
function formatDay(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleDateString([], { weekday: 'short' });
}

// Fetch weather data from OpenWeatherMap API
async function fetchWeatherData(lat, lon) {
    try {
        // Current weather and forecast
        const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const currentData = await currentResponse.json();
        
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${API_KEY}&units=metric`);
        const forecastData = await forecastResponse.json();
        
        return { current: currentData, forecast: forecastData };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

// Update UI with weather data
function updateWeatherUI(data) {
    if (!data) {
        locationElement.textContent = 'Unable to fetch weather data';
        return;
    }
    
    const { current, forecast } = data;
    
    // Location
    locationElement.textContent = `${current.name}, ${current.sys.country}`;
    
    // Current weather
    weatherIcon.innerHTML = `<i class="${getWeatherIcon(current.weather[0].icon)}"></i>`;
    temperatureElement.textContent = `${Math.round(current.main.temp)}°`;
    weatherDescription.textContent = current.weather[0].description;
    highTempElement.textContent = `H:${Math.round(forecast.daily[0].temp.max)}°`;
    lowTempElement.textContent = `L:${Math.round(forecast.daily[0].temp.min)}°`;
    
    // Hourly forecast
    hourlyContainer.innerHTML = '';
    for (let i = 0; i < 24; i += 3) {
        const hour = forecast.hourly[i];
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <div class="hourly-time">${formatHour(hour.dt, forecast.timezone_offset)}</div>
            <div class="hourly-icon"><i class="${getWeatherIcon(hour.weather[0].icon)}"></i></div>
            <div class="hourly-temp">${Math.round(hour.temp)}°</div>
        `;
        hourlyContainer.appendChild(hourlyItem);
    }
    
    // Daily forecast
    dailyContainer.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const day = forecast.daily[i];
        const dailyItem = document.createElement('div');
        dailyItem.className = 'daily-item';
        dailyItem.innerHTML = `
            <div class="daily-day">${i === 0 ? 'Today' : formatDay(day.dt, forecast.timezone_offset)}</div>
            <div class="daily-icon"><i class="${getWeatherIcon(day.weather[0].icon)}"></i></div>
            <div class="daily-temps">
                <div class="daily-high">${Math.round(day.temp.max)}°</div>
                <div class="daily-low">${Math.round(day.temp.min)}°</div>
            </div>
        `;
        dailyContainer.appendChild(dailyItem);
    }
    
    // Weather details
    sunriseElement.textContent = formatTime(current.sys.sunrise, forecast.timezone_offset);
    sunsetElement.textContent = formatTime(current.sys.sunset, forecast.timezone_offset);
    humidityElement.textContent = `${current.main.humidity}%`;
    windElement.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;
    feelsLikeElement.textContent = `${Math.round(current.main.feels_like)}°`;
    pressureElement.textContent = `${current.main.pressure} hPa`;
}

// Get user's current location
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const weatherData = await fetchWeatherData(latitude, longitude);
                updateWeatherUI(weatherData);
            },
            (error) => {
                console.error('Geolocation error:', error);
                // Default to a location if geolocation fails (e.g., New York)
                fetchWeatherData(40.7128, -74.0060)
                    .then(updateWeatherUI)
                    .catch(err => {
                        locationElement.textContent = 'Unable to determine location';
                        console.error('Error fetching default location weather:', err);
                    });
            }
        );
    } else {
        locationElement.textContent = 'Geolocation is not supported by this browser.';
    }
}

// Initialize the app
function init() {
    updateDate();
    getLocation();
    
    // Update date every minute (in case day changes)
    setInterval(updateDate, 60000);
}

// Start the app
init();
