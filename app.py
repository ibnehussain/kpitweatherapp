from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
REQUEST_TIMEOUT_SECONDS = 8


def error_response(code, message, status):
    return jsonify({"error": {"code": code, "message": message}}), status


def fetch_json(url, params):
    request_url = f"{url}?{urlencode(params)}"
    request = Request(request_url, headers={"User-Agent": "WeatherDashboard/1.0"})
    with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        return json.load(response)


@app.get("/")
def dashboard():
    return render_template("index.html")


@app.get("/weather")
def weather():
    city = request.args.get("city", "").strip()
    if not city:
        return error_response("CITY_REQUIRED", "Enter a city name.", 400)
    if len(city) > 100:
        return error_response("CITY_TOO_LONG", "City names must be 100 characters or fewer.", 400)

    try:
        geocoding = fetch_json(
            GEOCODING_URL,
            {"name": city, "count": 1, "language": "en", "format": "json"},
        )
    except (HTTPError, URLError, TimeoutError, ValueError):
        return error_response("GEOCODING_UNAVAILABLE", "The location service is unavailable.", 502)

    result = (geocoding.get("results") or [None])[0]
    if not result:
        return error_response("LOCATION_NOT_FOUND", "We could not find that city.", 404)

    latitude = result.get("latitude")
    longitude = result.get("longitude")
    try:
        forecast = fetch_json(
            FORECAST_URL,
            {
                "latitude": latitude,
                "longitude": longitude,
                "current": "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,is_day",
                "timezone": "auto",
                "forecast_days": 7,
            },
        )
    except (HTTPError, URLError, TimeoutError, ValueError):
        return error_response("FORECAST_UNAVAILABLE", "The weather service is unavailable.", 502)

    current = forecast.get("current", {})
    return jsonify(
        {
            "location": {
                "name": result.get("name", city),
                "latitude": latitude,
                "longitude": longitude,
                "timezone": forecast.get("timezone", ""),
            },
            "current": {
                "temperature": current.get("temperature_2m"),
                "feels_like": current.get("apparent_temperature"),
                "humidity": current.get("relative_humidity_2m"),
                "weather_code": current.get("weather_code"),
                "wind_speed": current.get("wind_speed_10m"),
                "precipitation": current.get("precipitation"),
                "is_day": current.get("is_day", 1),
                "condition": "Conditions updated",
            },
            "daily": forecast.get("daily", {}),
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
