# KPIT Weather App

A lightweight Flask web application that displays current weather conditions for any city using the [Open-Meteo](https://open-meteo.com/) API (no API key required).

## Features

- Search weather by city name
- Displays current temperature, feels-like temperature, humidity, wind speed, and precipitation
- Day/night awareness via weather code
- 7-day forecast data
- Auto-detects timezone based on location

## Requirements

- Python 3.8+
- Flask

## Installation

```bash
# Clone the repository
git clone https://github.com/ibnehussain/kpitweatherapp.git
cd kpitweatherapp

# Install dependencies
pip install flask
```

## Running the App

```bash
python app.py
```

Then open your browser and navigate to `http://127.0.0.1:5000`.

## Usage

1. Enter a city name in the search box.
2. The app fetches the location coordinates via the Open-Meteo Geocoding API.
3. Current weather data is retrieved and displayed on the dashboard.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Renders the weather dashboard |
| GET | `/weather?city=<name>` | Returns JSON weather data for the given city |

### Example Response

```json
{
  "location": {
    "name": "London",
    "latitude": 51.5085,
    "longitude": -0.1257,
    "timezone": "Europe/London"
  },
  "current": {
    "temperature": 18.2,
    "feels_like": 16.5,
    "humidity": 72,
    "weather_code": 3,
    "wind_speed": 14.4,
    "precipitation": 0.0,
    "is_day": 1,
    "condition": "Conditions updated"
  },
  "daily": {}
}
```

## Project Structure

```
kpitweatherapp/
├── app.py            # Flask application and API routes
├── templates/
│   └── index.html    # Main dashboard template
├── static/
│   ├── css/          # Stylesheets
│   └── js/           # JavaScript files
└── README.md
```

## License

This project is open source. See the repository for details.
