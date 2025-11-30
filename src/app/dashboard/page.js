"use client";

import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where,
  limit 
} from "firebase/firestore";

// Lazy load components to not block page load
const PollenInfo = lazy(() => import("@/components/PollenInfo"));
const WeatherCard = lazy(() => import("@/components/WeatherCard"));

const LoadingPlaceholder = () => (
  <div className="bg-gray-100 rounded-lg h-32 animate-pulse"></div>
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [recentSymptoms, setRecentSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const abortControllerRef = useRef(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user && !abortControllerRef.current.signal.aborted) {
        fetchUserData(user.uid);
      } else if (!user) {
        setLoading(false);
      }
    });

    return () => {
      abortControllerRef.current.abort();
      unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId) => {
    try {
      // Create abort signal with 10 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Fetch user's allergies
      const allergiesQuery = query(collection(db, "allergies"), where("userId", "==", userId), limit(50));
      const allergiesSnapshot = await Promise.race([
        getDocs(allergiesQuery),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Allergies query timeout")), 8000))
      ]);
      if (abortControllerRef.current.signal.aborted) return;
      
      const allergiesData = [];
      allergiesSnapshot.forEach((doc) => {
        allergiesData.push({ id: doc.id, ...doc.data() });
      });
      setAllergies(allergiesData);

      // Fetch recent symptoms without orderBy to avoid index requirement
      const symptomsQuery = query(
        collection(db, "symptoms"), 
        where("userId", "==", userId),
        limit(20)
      );
      const symptomsSnapshot = await Promise.race([
        getDocs(symptomsQuery),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Symptoms query timeout")), 8000))
      ]);
      if (abortControllerRef.current.signal.aborted) return;
      
      const symptomsData = [];
      symptomsSnapshot.forEach((doc) => {
        const data = doc.data();
        symptomsData.push({ 
          id: doc.id, 
          ...data,
          date: data.date?.toDate?.() || new Date(data.date)
        });
      });
      
      // Sort on client side instead of Firestore
      symptomsData.sort((a, b) => b.date - a.date);
      setRecentSymptoms(symptomsData.slice(0, 10));
      
      clearTimeout(timeoutId);

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name !== 'AbortError') {
        console.error("Error fetching user data:", error);
        setError("Failed to load some dashboard data");
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  };

 


  const getPollenLevel = (level) => {
    const colors = {
      "Low": "bg-green-100 text-green-800",
      "Medium": "bg-yellow-100 text-yellow-800", 
      "High": "bg-red-100 text-red-800"
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  const getAirQualityColor = (index) => {
    if (index <= 50) return "bg-green-100 text-green-800";
    if (index <= 100) return "bg-yellow-100 text-yellow-800";
    if (index <= 150) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getSeverityStats = () => {
    const stats = { mild: 0, moderate: 0, severe: 0, emergency: 0 };
    recentSymptoms.forEach(symptom => {
      stats[symptom.severity] = (stats[symptom.severity] || 0) + 1;
    });
    return stats;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const severityStats = getSeverityStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome back, {user.displayName || user.email}!
            </h1>
            <div className="text-right">
              <p className="text-lg font-medium text-gray-700">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
          <p className="text-gray-600">Here is your allergy and health overview for today.</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        

        {/* Main Grid */}
        
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Weather & Environment */}
          
          <div className="lg:col-span-2 space-y-6">
            {/* Weather & Pollen - Lazy loaded */}
            <Suspense fallback={<LoadingPlaceholder />}>
              <div className="bg-white rounded-lg shadow p-6">
                <WeatherCard />
              </div>
            </Suspense>

            <Suspense fallback={<LoadingPlaceholder />}>
              <PollenInfo />
            </Suspense>

            {/* Recent Symptoms */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Symptoms</h2>
                <a href="/symptomsLog" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All →
                </a>
              </div>
              
              {recentSymptoms.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">😊</div>
                  <p className="text-gray-600">No symptoms logged recently!</p>
                  <a 
                    href="/symptomsLog" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
                  >
                    Log your first symptom
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSymptoms.slice(0, 5).map((symptom) => (
                    <div key={symptom.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{symptom.icon}</span>
                        <div>
                          <p className="font-medium text-gray-800">{symptom.name}</p>
                          <p className="text-sm text-gray-600">
                            {symptom.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        symptom.severity === 'mild' ? 'bg-green-100 text-green-800' :
                        symptom.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        symptom.severity === 'severe' ? 'bg-red-100 text-red-800' :
                        'bg-red-600 text-white'
                      }`}>
                        {symptom.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Allergies Tracked</span>
                  <span className="text-2xl font-bold text-blue-600">{allergies.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Symptoms This Week</span>
                  <span className="text-2xl font-bold text-orange-600">{recentSymptoms.length}</span>
                </div>
              </div>
            </div>

            {/* Symptom Severity Breakdown */}
            {recentSymptoms.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Symptom Severity</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mild</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{width: `${(severityStats.mild / recentSymptoms.length) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{severityStats.mild}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Moderate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{width: `${(severityStats.moderate / recentSymptoms.length) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{severityStats.moderate}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Severe</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{width: `${(severityStats.severe / recentSymptoms.length) * 100}%`}}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{severityStats.severe}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Your Allergies */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Your Allergies</h2>
                <a href="/myAllergies" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Manage →
                </a>
              </div>
              
              {allergies.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-2">No allergies added yet</p>
                  <a 
                    href="/myAllergies" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Add your first allergy
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {allergies.slice(0, 6).map((allergy) => (
                    <div key={allergy.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <span className="text-lg">{allergy.icon}</span>
                      <span className="text-sm font-medium text-gray-800">{allergy.name}</span>
                    </div>
                  ))}
                  {allergies.length > 6 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      +{allergies.length - 6} more allergies
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <a 
                  href="/symptomsLog"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors"
                >
                  📝 Log Symptoms
                </a>
                <a 
                  href="/myAllergies"
                  className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors"
                >
                  🏥 Manage Allergies
                </a>
                <a 
                  href="/reports"
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors"
                >
                  📊 View Reports
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}