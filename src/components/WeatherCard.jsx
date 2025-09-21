"use client";

import { useState, useEffect } from "react";
import useGeolocation from "@/hooks/Geolocation";

export default function WeatherCard() {
  const { coords, error: geoError } = useGeolocation();
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      if (!coords.lat || !coords.lon) return;

      try {
        setLoading(true);
        const res = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&q=${coords.lat},${coords.lon}&days=5`
        );

        if (!res.ok) throw new Error("Failed to fetch weather data");

        const data = await res.json();
        setWeather(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [coords.lat, coords.lon]);

  if (geoError) return <p className="text-red-500">Geolocation error: {geoError}</p>;
  if (loading) return <p>Loading weather...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!weather) return null;

  const current = weather.current;
  const forecast = weather.forecast.forecastday;

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-2xl p-4">
      {/* Header */}
      <div className="border-b pb-2 mb-4">
        <h2 className="text-lg font-semibold">
          🌤 {weather.location.name}, {weather.location.region}
        </h2>
        <p className="text-sm text-gray-500">{weather.location.localtime}</p>
      </div>

      {/* Current conditions */}
      <div className="flex items-center gap-4 mb-6">
        <img
          src={current.condition.icon}
          alt={current.condition.text}
          className="w-16 h-16"
        />
        <div>
          <p className="text-3xl font-bold">{current.temp_c}°C</p>
          <p className="text-gray-600">{current.condition.text}</p>
          <p className="text-gray-500 text-sm">
            Feels like {current.feelslike_c}°C
          </p>
        </div>
      </div>

      {/* 5-day forecast */}
      <div className="space-y-2">
        {forecast.map((day) => (
          <div
            key={day.date}
            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
          >
            <span className="text-sm font-medium">{day.date}</span>
            <div className="flex items-center gap-2">
              <img
                src={day.day.condition.icon}
                alt={day.day.condition.text}
                className="w-8 h-8"
              />
              <span className="text-sm">
                {day.day.avgtemp_c}°C ({day.day.mintemp_c}° / {day.day.maxtemp_c}°)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
