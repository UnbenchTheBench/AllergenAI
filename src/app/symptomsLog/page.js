"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  updateDoc 
} from "firebase/firestore";

export default function SymptomsLog() {
  const [user, setUser] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");

  // Common symptoms list
  const commonSymptoms = [
    { name: "Sneezing", icon: "🤧", category: "Respiratory" },
    { name: "Runny Nose", icon: "👃", category: "Respiratory" },
    { name: "Stuffy Nose", icon: "😤", category: "Respiratory" },
    { name: "Coughing", icon: "😷", category: "Respiratory" },
    { name: "Wheezing", icon: "🫁", category: "Respiratory" },
    { name: "Shortness of Breath", icon: "💨", category: "Respiratory" },
    { name: "Itchy Eyes", icon: "👁️", category: "Eyes" },
    { name: "Watery Eyes", icon: "😭", category: "Eyes" },
    { name: "Red Eyes", icon: "🔴", category: "Eyes" },
    { name: "Swollen Eyes", icon: "😵", category: "Eyes" },
    { name: "Skin Rash", icon: "🔴", category: "Skin" },
    { name: "Hives", icon: "🟥", category: "Skin" },
    { name: "Itchy Skin", icon: "🤲", category: "Skin" },
    { name: "Eczema", icon: "🔴", category: "Skin" },
    { name: "Headache", icon: "🤕", category: "General" },
    { name: "Fatigue", icon: "😴", category: "General" },
    { name: "Nausea", icon: "🤢", category: "Digestive" },
    { name: "Stomach Pain", icon: "🤮", category: "Digestive" },
    { name: "Diarrhea", icon: "💩", category: "Digestive" },
    { name: "Throat Swelling", icon: "🗣️", category: "Severe" }
  ];

  // Severity levels
  const severityLevels = [
    { value: "mild", label: "Mild", color: "bg-green-100 text-green-800" },
    { value: "moderate", label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
    { value: "severe", label: "Severe", color: "bg-red-100 text-red-800" },
    { value: "emergency", label: "Emergency", color: "bg-red-600 text-white" }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchSymptoms(user.uid);
        fetchAllergies(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchSymptoms = async (userId) => {
    try {
      const q = query(
        collection(db, "symptoms"), 
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const symptomsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        symptomsData.push({ 
          id: doc.id, 
          ...data,
          date: data.date?.toDate?.() || new Date(data.date)
        });
      });
      setSymptoms(symptomsData);
    } catch (error) {
      console.error("Error fetching symptoms:", error);
      setError("Failed to load symptoms");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllergies = async (userId) => {
    try {
      const q = query(collection(db, "allergies"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const allergiesData = [];
      querySnapshot.forEach((doc) => {
        allergiesData.push({ id: doc.id, ...doc.data() });
      });
      setAllergies(allergiesData);
    } catch (error) {
      console.error("Error fetching allergies:", error);
    }
  };

  const addSymptom = async (symptomData) => {
    if (!user) return;

    try {
      const docRef = await addDoc(collection(db, "symptoms"), {
        ...symptomData,
        userId: user.uid,
        createdAt: new Date()
      });
      
      const newSymptom = { 
        id: docRef.id, 
        ...symptomData, 
        userId: user.uid,
        date: new Date(symptomData.date)
      };
      
      setSymptoms([newSymptom, ...symptoms]);
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding symptom:", error);
      setError("Failed to add symptom");
    }
  };

  const deleteSymptom = async (symptomId) => {
    try {
      await deleteDoc(doc(db, "symptoms", symptomId));
      setSymptoms(symptoms.filter(symptom => symptom.id !== symptomId));
    } catch (error) {
      console.error("Error deleting symptom:", error);
      setError("Failed to delete symptom");
    }
  };

  const updateSymptom = async (symptomId, updates) => {
    try {
      await updateDoc(doc(db, "symptoms", symptomId), updates);
      setSymptoms(symptoms.map(symptom => 
        symptom.id === symptomId 
          ? { ...symptom, ...updates }
          : symptom
      ));
    } catch (error) {
      console.error("Error updating symptom:", error);
      setError("Failed to update symptom");
    }
  };

  const filteredSymptoms = symptoms.filter(symptom => {
    const dateMatch = !filterDate || 
      symptom.date.toISOString().split('T')[0] === filterDate;
    const severityMatch = !filterSeverity || 
      symptom.severity === filterSeverity;
    return dateMatch && severityMatch;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to view your symptoms log.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your symptoms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Symptoms Log</h1>
          <p className="text-gray-600">Track your allergy symptoms to identify patterns and triggers.</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Log New Symptom
            </button>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Severities</option>
                  {severityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              {(filterDate || filterSeverity) && (
                <button
                  onClick={() => {
                    setFilterDate("");
                    setFilterSeverity("");
                  }}
                  className="self-end px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Symptoms List */}
        {filteredSymptoms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {symptoms.length === 0 ? "No Symptoms Logged Yet" : "No Symptoms Match Your Filters"}
            </h3>
            <p className="text-gray-600 mb-4">
              {symptoms.length === 0 
                ? "Start tracking your symptoms to identify patterns and triggers."
                : "Try adjusting your filters to see more results."
              }
            </p>
            {symptoms.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Log Your First Symptom
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSymptoms.map((symptom) => (
              <SymptomCard
                key={symptom.id}
                symptom={symptom}
                allergies={allergies}
                onDelete={deleteSymptom}
                onUpdate={updateSymptom}
                severityLevels={severityLevels}
              />
            ))}
          </div>
        )}

        {/* Add Symptom Modal */}
        {showAddModal && (
          <AddSymptomModal
            commonSymptoms={commonSymptoms}
            allergies={allergies}
            severityLevels={severityLevels}
            onAdd={addSymptom}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </div>
  );
}

// Symptom Card Component
function SymptomCard({ symptom, allergies, onDelete, onUpdate, severityLevels }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSeverity, setEditSeverity] = useState(symptom.severity);

  const getSeverityStyle = (severity) => {
    const level = severityLevels.find(s => s.value === severity);
    return level ? level.color : "bg-gray-100 text-gray-800";
  };

  const handleSeverityUpdate = () => {
    onUpdate(symptom.id, { severity: editSeverity });
    setIsEditing(false);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const relatedAllergy = allergies.find(a => a.id === symptom.relatedAllergyId);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{symptom.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{symptom.name}</h3>
            <p className="text-sm text-gray-600">{formatDate(symptom.date)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-blue-500 hover:text-blue-700 transition-colors"
            title="Edit severity"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(symptom.id)}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="Delete symptom"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Severity */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Severity:</span>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <select
                value={editSeverity}
                onChange={(e) => setEditSeverity(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {severityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSeverityUpdate}
                className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditSeverity(symptom.severity);
                }}
                className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityStyle(symptom.severity)}`}>
              {severityLevels.find(s => s.value === symptom.severity)?.label}
            </span>
          )}
        </div>

        {/* Related Allergy */}
        {relatedAllergy && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Related to:</span>
            <div className="flex items-center gap-2">
              <span>{relatedAllergy.icon}</span>
              <span className="text-sm text-gray-600">{relatedAllergy.name}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {symptom.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{symptom.notes}</p>
          </div>
        )}

        {/* Weather/Location if available */}
        {(symptom.weather || symptom.location) && (
          <div className="flex gap-4 text-sm text-gray-600">
            {symptom.weather && (
              <span>🌤️ {symptom.weather}</span>
            )}
            {symptom.location && (
              <span>📍 {symptom.location}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Add Symptom Modal Component
function AddSymptomModal({ commonSymptoms, allergies, severityLevels, onAdd, onClose }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState("mild");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [relatedAllergyId, setRelatedAllergyId] = useState("");
  const [notes, setNotes] = useState("");
  const [weather, setWeather] = useState("");
  const [location, setLocation] = useState("");

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms(prev => {
      const isSelected = prev.some(s => s.name === symptom.name);
      if (isSelected) {
        return prev.filter(s => s.name !== symptom.name);
      } else {
        return [...prev, symptom];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedSymptoms.length === 0) {
      alert("Please select at least one symptom");
      return;
    }

    // Create a symptom entry for each selected symptom
    selectedSymptoms.forEach(symptom => {
      const symptomData = {
        name: symptom.name,
        icon: symptom.icon,
        category: symptom.category,
        severity: severity,
        date: new Date(date),
        relatedAllergyId: relatedAllergyId || null,
        notes: notes,
        weather: weather,
        location: location
      };

      onAdd(symptomData);
    });
  };

  const groupedSymptoms = commonSymptoms.reduce((groups, symptom) => {
    const category = symptom.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(symptom);
    return groups;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Log New Symptoms</h2>

        <form onSubmit={handleSubmit}>
          {/* Symptom Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Symptoms (you can choose multiple)
            </label>
            {Object.entries(groupedSymptoms).map(([category, symptoms]) => (
              <div key={category} className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">{category}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {symptoms.map((symptom) => (
                    <label
                      key={symptom.name}
                      className={`flex items-center p-2 border rounded-lg cursor-pointer transition-colors ${
                        selectedSymptoms.some(s => s.name === symptom.name)
                          ? 'bg-blue-50 border-blue-300'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSymptoms.some(s => s.name === symptom.name)}
                        onChange={() => handleSymptomToggle(symptom)}
                        className="mr-2"
                      />
                      <span className="mr-1">{symptom.icon}</span>
                      <span className="text-sm">{symptom.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Date & Time */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Severity */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {severityLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Related Allergy */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Allergy (Optional)
            </label>
            <select
              value={relatedAllergyId}
              onChange={(e) => setRelatedAllergyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No specific allergy</option>
              {allergies.map((allergy) => (
                <option key={allergy.id} value={allergy.id}>
                  {allergy.icon} {allergy.name}
                </option>
              ))}
            </select>
          </div>

          {/* Weather & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weather (Optional)
              </label>
              <input
                type="text"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Sunny, Rainy, High pollen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Home, Office, Park"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Any additional details about your symptoms..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Log Symptoms
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}