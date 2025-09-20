// hooks/useGeolocation.js
import { useState, useEffect } from "react";

export default function useGeolocation() {
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    const handleSuccess = (position) => {
      setCoords({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
    };

    const handleError = (err) => {
      setError(err.message);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
  }, []);

  return { coords, error };
}

/*

EXAMPLE

import useGeolocation from "../hooks/useGeolocation";

export default function Dashboard() {
  const { coords, error } = useGeolocation(); 

  */