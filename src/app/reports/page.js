"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  limit
} from "firebase/firestore";
import { generatePDFReport } from "../../utils/pdfGenerator";

export default function Reports() {
  const [user, setUser] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("30"); // days
  const [reportType, setReportType] = useState("overview");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;
      setUser(user);
      if (user) {
        fetchUserData(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId) => {
    try {
      // Fetch symptoms - with 8 second timeout
      const symptomsQuery = query(
        collection(db, "symptoms"),
        where("userId", "==", userId),
        limit(100)
      );
      const symptomsSnapshot = await Promise.race([
        getDocs(symptomsQuery),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Symptoms query timeout")), 8000))
      ]);
      const symptomsData = [];
      symptomsSnapshot.forEach((doc) => {
        const data = doc.data();
        symptomsData.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || new Date(data.date)
        });
      });
      // Sort on client side
      symptomsData.sort((a, b) => b.date - a.date);
      setSymptoms(symptomsData);

      // Fetch allergies - with 8 second timeout
      const allergiesQuery = query(collection(db, "allergies"), where("userId", "==", userId), limit(100));
      const allergiesSnapshot = await Promise.race([
        getDocs(allergiesQuery),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Allergies query timeout")), 8000))
      ]);
      const allergiesData = [];
      allergiesSnapshot.forEach((doc) => {
        allergiesData.push({ id: doc.id, ...doc.data() });
      });
      setAllergies(allergiesData);

    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSymptoms = () => {
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return symptoms.filter(symptom => symptom.date >= cutoffDate);
  };

  const getSeverityStats = () => {
    const filteredSymptoms = getFilteredSymptoms();
    const stats = { mild: 0, moderate: 0, severe: 0, emergency: 0 };
    filteredSymptoms.forEach(symptom => {
      stats[symptom.severity] = (stats[symptom.severity] || 0) + 1;
    });
    return stats;
  };

  const getSymptomFrequency = () => {
    const filteredSymptoms = getFilteredSymptoms();
    const frequency = {};
    filteredSymptoms.forEach(symptom => {
      frequency[symptom.name] = (frequency[symptom.name] || 0) + 1;
    });
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  const getWeeklyTrends = () => {
    const filteredSymptoms = getFilteredSymptoms();
    const weeklyData = {};
    
    filteredSymptoms.forEach(symptom => {
      const weekStart = new Date(symptom.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { mild: 0, moderate: 0, severe: 0, emergency: 0 };
      }
      weeklyData[weekKey][symptom.severity]++;
    });

    return Object.entries(weeklyData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-8);
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      await generatePDFReport({
        timeRange,
        symptoms,
        allergies,
        getSeverityStats,
        getSymptomFrequency,
        getFilteredSymptoms
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to view reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reports...</p>
        </div>
      </div>
    );
  }

  const severityStats = getSeverityStats();
  const symptomFrequency = getSymptomFrequency();
  const weeklyTrends = getWeeklyTrends();
  const filteredSymptoms = getFilteredSymptoms();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Health Reports</h1>
          <p className="text-gray-600">Analyze your allergy patterns and symptoms over time.</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="-5">Next 5 days</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="365">Last year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select 
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="overview">Overview</option>
                  <option value="detailed">Detailed Analysis</option>
                  <option value="trends">Trends & Patterns</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  📄 Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredSymptoms.length}</div>
            <div className="text-sm text-gray-600">Total Symptoms</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{allergies.length}</div>
            <div className="text-sm text-gray-600">Tracked Allergies</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((filteredSymptoms.length / parseInt(timeRange)) * 10) / 10}
            </div>
            <div className="text-sm text-gray-600">Avg. Symptoms/Day</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(getSymptomFrequency().reduce((acc, [name]) => ({ ...acc, [name]: true }), {})).length}
            </div>
            <div className="text-sm text-gray-600">Unique Symptoms</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Symptom Severity Distribution</h2>
            <div className="space-y-4">
              {Object.entries(severityStats).map(([severity, count]) => {
                const total = Object.values(severityStats).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const colors = {
                  mild: 'bg-green-500',
                  moderate: 'bg-yellow-500',
                  severe: 'bg-red-500',
                  emergency: 'bg-red-700'
                };
                
                return (
                  <div key={severity} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{severity}</span>
                    <div className="flex items-center gap-3 flex-1 max-w-xs">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${colors[severity]}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Most Common Symptoms */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Most Common Symptoms</h2>
            <div className="space-y-3">
              {symptomFrequency.slice(0, 8).map(([symptom, count], index) => (
                <div key={symptom} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm text-gray-700">{symptom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(count / symptomFrequency[0][1]) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-6">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Trends */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Symptom Trends</h2>
            <div className="space-y-3">
              {weeklyTrends.map(([week, data]) => {
                const total = Object.values(data).reduce((a, b) => a + b, 0);
                const maxWeekly = Math.max(...weeklyTrends.map(([, d]) => Object.values(d).reduce((a, b) => a + b, 0)));
                
                return (
                  <div key={week} className="flex items-center gap-4">
                    <div className="w-20 text-xs text-gray-600">
                      {new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-4 flex overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${(data.mild / total) * 100}%` }}></div>
                        <div className="bg-yellow-500 h-full" style={{ width: `${(data.moderate / total) * 100}%` }}></div>
                        <div className="bg-red-500 h-full" style={{ width: `${(data.severe / total) * 100}%` }}></div>
                        <div className="bg-red-700 h-full" style={{ width: `${(data.emergency / total) * 100}%` }}></div>
                      </div>
                    </div>
                    <div className="w-8 text-xs text-gray-600 text-right">{total}</div>
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Mild</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Severe</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-700 rounded"></div>
                <span>Emergency</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Symptom Log</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredSymptoms.slice(0, 15).map((symptom) => (
                <div key={symptom.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{symptom.icon}</span>
                    <div>
                      <p className="font-medium text-gray-800">{symptom.name}</p>
                      <p className="text-sm text-gray-600">
                        {symptom.date.toLocaleDateString()} at {symptom.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
              
              {filteredSymptoms.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-600">No symptoms logged in this time period.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}