import os

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

load_dotenv()

app = Flask(__name__)

WEATHERBIT_API_KEY = os.getenv("WEATHERBIT_API_KEY")
WEATHERBIT_API_URL = "https://api.weatherbit.io/v2.0/current"


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/app.js")
def javascript():
    return send_from_directory(".", "app.js")


@app.route("/style.css")
def stylesheet():
    return send_from_directory(".", "style.css")


@app.route("/api/weather")
def weather():
    city = request.args.get("city", "").strip()

    if not city:
        return jsonify({"error": "City is required"}), 400

    try:
        response = requests.get(
            WEATHERBIT_API_URL,
            params={
                "city": city,
                "key": WEATHERBIT_API_KEY
            },
            timeout=10
        )

        return jsonify(response.json()), response.status_code

    except requests.RequestException as error:
        print("Weatherbit API error:", error)
        return jsonify({
            "error": "Unable to fetch weather data"
        }), 500


if __name__ == "__main__":
    app.run(debug=True)