import { useState, useEffect } from "react";

export default function useGeolocation() {
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    // Set a timeout for geolocation request (5 seconds)
    const timeoutId = setTimeout(() => {
      setError("Geolocation request timed out");
      setLoading(false);
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        clearTimeout(timeoutId);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => clearTimeout(timeoutId);
  }, []);

  return { coords, error, loading };
}
