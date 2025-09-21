import { useState, useEffect } from "react";

export default function useGeolocation() {
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (err) => setError(err.message)
    );
  }, []);

  return { coords, error };
}
