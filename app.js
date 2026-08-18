// IndexedDB Setup
let db;
const dbName = 'WeatherDB';
const dbVersion = 1;
const storeName = 'weatherData';

const request = indexedDB.open(dbName, dbVersion);

request.onerror = (event) => {
    console.error('IndexedDB error:', event.target.error);
};

request.onsuccess = (event) => {
    db = event.target.result;
    console.log('IndexedDB opened successfully');
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'city' });
        console.log('Object store created');
    }
};


// Main Function
async function getWeather(city) {
    if (!db) {
        console.error('IndexedDB not initialized yet.');
        return;
    }

    const lowerCity = city.toLowerCase();

    // Check network status
    if (navigator.onLine) {
        console.log('Gathering Data from the API Online.');

        try {
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            const data = await response.json();

            if (data.data && data.data.length > 0) {
                const weatherData = data.data[0];
                await cacheWeatherData(weatherData);
                displayWeather(weatherData);
            } else {
                throw new Error('City not found');
            }
        } catch (error) {
            console.error('Error fetching weather from API:', error);
            document.getElementById('weatherInfo').textContent = 'Error fetching weather data';
        }

    } else {
        console.log('Gathering Data from the IndexedDB without a Network Connection.');

        try {
            const cachedData = await getCachedWeather(lowerCity);
            if (cachedData) {
                displayWeather(cachedData);
            } else {
                console.log('Cannot receive data from API or IndexedDB.');
                document.getElementById('weatherInfo').textContent =
                    'No cached data available. Please connect to the internet first.';
            }
        } catch (error) {
            console.error('Error accessing cached data:', error);
        }
    }
}

// Display Weather
function displayWeather(weatherData) {
    const weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = `
        <h2>${weatherData.city_name}, ${weatherData.state_code || ''}</h2>
        <p>Temperature: ${weatherData.temp}°C</p>
        <p>Feels Like: ${weatherData.app_temp}°C</p>
        <p>Sunrise: ${weatherData.sunrise} | Sunset: ${weatherData.sunset}</p>
        <p>Weather: ${weatherData.weather.description}</p>
        <p>Wind: ${weatherData.wind_spd} m/s, ${weatherData.wind_cdir_full}</p>
    `;
}

// Cache Data in IndexedDB
async function cacheWeatherData(weatherData) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.put({
            city: weatherData.city_name.toLowerCase(),
            data: weatherData,
            timestamp: Date.now()
        });

        request.onerror = () => reject('Error caching weather data');
        request.onsuccess = () => resolve();
    });
}

// Retrieve Cached Data
async function getCachedWeather(city) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.get(city);

        request.onerror = () => reject('Error retrieving cached data');
        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result) {
                resolve(result.data);
            } else {
                resolve(null);
            }
        };
    });
}

// Event Listener
document.getElementById('getWeather').addEventListener('click', () => {
    const city = document.getElementById('location').value.trim();
    if (city) {
        getWeather(city);
    }
});
