"use client";

import { useState, useEffect } from "react";

export default function AutoGeolocation() {
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Automatically runs on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (err) => {
          setError(err.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  // Now coords.lat and coords.lon hold the values
  console.log("Latitude:", coords.lat, "Longitude:", coords.lon);

  return (
    <div>
      {error && <p>Error: {error}</p>}
      {coords.lat && coords.lon ? (
        <p>
          Latitude: {coords.lat}, Longitude: {coords.lon}
        </p>
      ) : (
        <p>Getting location...</p>
      )}
    </div>
  );
}
