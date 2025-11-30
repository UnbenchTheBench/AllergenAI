"use client";
import useGeolocation from "@/hooks/Geolocation";
import { useEffect, useState } from "react";

export default function PollenInfo() {
  const [pollenData, setPollenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { coords, error: geoError, loading: geoLoading } = useGeolocation();

  useEffect(() => {
    const fetchPollenData = async () => {
      // Only attempt if we have coords and geolocation isn't timing out
      if (!coords.lat || !coords.lon) {
        if (!geoLoading && geoError) {
          setLoading(false);
        }
        return;
      }
      
      try {
        const response = await fetch(`/api/pollen?lat=${coords.lat}&lon=${coords.lon}`, {
          signal: AbortSignal.timeout(8000) // 8 second timeout
        });
        if (!response.ok) throw new Error("Failed to fetch pollen data");
        const data = await response.json();
        setPollenData(data.data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch pollen only after geolocation completes
    if (!geoLoading) {
      fetchPollenData();
    }
  }, [coords, geoLoading]);


  const getPollenLevelClasses = (level) => {
    const colors = {
      "Low": "bg-green-100 text-green-800",
      "Medium": "bg-yellow-100 text-yellow-800",
      "High": "bg-red-100 text-red-800",
      "Very High": "bg-red-200 text-red-900"
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  if (loading) return (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p className="text-gray-500 font-medium">Loading pollen forecast...</p>
    </div>
  );

  if (error || geoError) return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
      <p>Pollen data unavailable. {error || geoError}</p>
    </div>
  );

  if (!pollenData || pollenData.length === 0) return (
    <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
      No pollen data available.
    </div>
  );

  return (
    <div className="space-y-6">
      {pollenData.map((day, index) => (
        <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">
              Pollen Forecast
            </h2>
            <p className="text-sm text-gray-500 italic">
              Updated: {new Date(day.updatedAt).toLocaleString()}
            </p>
          </div>

          {/* Risk Levels */}
          <div className="mb-4">
            <h3 className="text-gray-700 font-semibold mb-2 text-lg">Risk Levels</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(day.Risk).map(([type, level]) => (
                <span 
                  key={type} 
                  className={`px-4 py-1 rounded-full text-sm font-medium ${getPollenLevelClasses(level)}`}
                >
                  {type.replace("_pollen", "")}: {level}
                </span>
              ))}
            </div>
          </div>

          {/* Counts */}
          <div className="mb-4">
            <h3 className="text-gray-700 font-semibold mb-2 text-lg">Pollen Counts</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(day.Count).map(([type, count]) => (
                <span 
                  key={type} 
                  className="px-4 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium"
                >
                  {type.replace("_pollen", "")}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Species Breakdown */}
          <div>
            <h3 className="text-gray-700 font-semibold mb-3 text-lg">Species Details</h3>

            {day.Species.Grass && (
              <div className="mb-3">
                <p className="font-semibold text-gray-800 mb-1">🌾 Grass</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-0.5">
                  {Object.entries(day.Species.Grass).map(([species, count]) => (
                    <li key={species}>{species}: {count}</li>
                  ))}
                </ul>
              </div>
            )}

            {day.Species.Tree && (
              <div className="mb-3">
                <p className="font-semibold text-gray-800 mb-1">🌳 Tree</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-0.5">
                  {Object.entries(day.Species.Tree).map(([species, count]) => (
                    <li key={species}>{species}: {count}</li>
                  ))}
                </ul>
              </div>
            )}

            {day.Species.Weed && (
              <div className="mb-3">
                <p className="font-semibold text-gray-800 mb-1">🌿 Weed</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-0.5">
                  {Object.entries(day.Species.Weed).map(([species, count]) => (
                    <li key={species}>{species}: {count}</li>
                  ))}
                </ul>
              </div>
            )}

            {day.Species.Others > 0 && (
              <p className="text-gray-600 text-sm">Others: {day.Species.Others}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
