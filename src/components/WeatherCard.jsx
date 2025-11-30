"use client";

import { useState, useEffect } from "react";
import useGeolocation from "@/hooks/Geolocation";

export default function WeatherCard() {
  const { coords, error: geoError, loading: geoLoading } = useGeolocation();
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      // Only fetch if geolocation is done and we have coords
      if (geoLoading) return;
      
      if (!coords.lat || !coords.lon) {
        setLoading(false);
        return;
      }

      try {
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
        if (!apiKey) {
          setError("Weather API key not configured");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${coords.lat},${coords.lon}&days=5`,
          { signal: AbortSignal.timeout(8000) } // 8 second timeout
        );

        if (!res.ok) throw new Error("Failed to fetch weather data");

        const data = await res.json();
        setWeather(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [coords.lat, coords.lon, geoLoading]);

  if (loading) return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500 text-center">Loading weather...</p>
    </div>
  );
  
  if (geoError || error) return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
      <p className="text-sm">Weather data unavailable. {geoError || error}</p>
    </div>
  );
  
  if (!weather) return null;

  const current = weather.current;
  const forecast = weather.forecast.forecastday;

  return (
    <>
    <div className="">
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
      


    </div>

    {forecast && (
  <div className="">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">5-Day Forecast</h2>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {forecast.map((day) => (
        <div key={day.date} className="text-center p-3 rounded-lg bg-gray-50">
          {/* Display the date */}
          <p className="text-sm font-medium text-gray-800">{day.date}</p>

          {/* Weather icon */}
          <div className="text-2xl my-2">
            <img
              src={day.day.condition.icon}
              alt={day.day.condition.text}
              className="w-10 h-10 mx-auto"
            />
          </div>

          {/* Condition text */}
          <p className="text-xs text-gray-600 mb-1">{day.day.condition.text}</p>

          {/* Temperature info */}
          <p className="text-sm">
            <span className="font-medium">{day.day.maxtemp_c}°C</span>
            <span className="text-gray-500">/{day.day.mintemp_c}°C</span>
          </p>
        </div>
      ))}
    </div>
  </div>
)}

</>
  );
}
