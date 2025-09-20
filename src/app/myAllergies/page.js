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
  updateDoc 
} from "firebase/firestore";

export default function MyAllergies() {
  const [user, setUser] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Common allergens list
  const commonAllergens = [
    { name: "Pollen (Tree)", category: "Environmental", icon: "🌳" },
    { name: "Pollen (Grass)", category: "Environmental", icon: "🌱" },
    { name: "Pollen (Ragweed)", category: "Environmental", icon: "🌿" },
    { name: "Dust Mites", category: "Environmental", icon: "🏠" },
    { name: "Pet Dander (Cats)", category: "Environmental", icon: "🐱" },
    { name: "Pet Dander (Dogs)", category: "Environmental", icon: "🐕" },
    { name: "Mold", category: "Environmental", icon: "🍄" },
    { name: "Peanuts", category: "Food", icon: "🥜" },
    { name: "Tree Nuts", category: "Food", icon: "🌰" },
    { name: "Shellfish", category: "Food", icon: "🦐" },
    { name: "Fish", category: "Food", icon: "🐟" },
    { name: "Eggs", category: "Food", icon: "🥚" },
    { name: "Milk", category: "Food", icon: "🥛" },
    { name: "Soy", category: "Food", icon: "🫘" },
    { name: "Wheat", category: "Food", icon: "🌾" },
    { name: "Penicillin", category: "Medication", icon: "💊" },
    { name: "Aspirin", category: "Medication", icon: "💊" },
    { name: "Latex", category: "Other", icon: "🧤" },
    { name: "Insect Stings", category: "Other", icon: "🐝" }
  ];

  // Severity levels
  const severityLevels = [
    { value: "mild", label: "Mild", color: "bg-green-100 text-green-800" },
    { value: "moderate", label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
    { value: "severe", label: "Severe", color: "bg-red-100 text-red-800" }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchAllergies(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
      setError("Failed to load allergies");
    } finally {
      setLoading(false);
    }
  };

  const addAllergy = async (allergyData) => {
    if (!user) return;

    try {
      const docRef = await addDoc(collection(db, "allergies"), {
        ...allergyData,
        userId: user.uid,
        createdAt: new Date()
      });
      
      setAllergies([...allergies, { id: docRef.id, ...allergyData, userId: user.uid }]);
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding allergy:", error);
      setError("Failed to add allergy");
    }
  };

  const deleteAllergy = async (allergyId) => {
    try {
      await deleteDoc(doc(db, "allergies", allergyId));
      setAllergies(allergies.filter(allergy => allergy.id !== allergyId));
    } catch (error) {
      console.error("Error deleting allergy:", error);
      setError("Failed to delete allergy");
    }
  };

  const updateSeverity = async (allergyId, newSeverity) => {
    try {
      await updateDoc(doc(db, "allergies", allergyId), {
        severity: newSeverity
      });
      
      setAllergies(allergies.map(allergy => 
        allergy.id === allergyId 
          ? { ...allergy, severity: newSeverity }
          : allergy
      ));
    } catch (error) {
      console.error("Error updating severity:", error);
      setError("Failed to update severity");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to view your allergies.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your allergies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Allergies</h1>
          <p className="text-gray-600">Manage your allergens and track their severity levels.</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Add Allergy Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Add New Allergy
          </button>
        </div>

        {/* Allergies Grid */}
        {allergies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">🤧</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Allergies Added Yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your known allergens to track them better.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Add Your First Allergy
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allergies.map((allergy) => (
              <AllergyCard
                key={allergy.id}
                allergy={allergy}
                onDelete={deleteAllergy}
                onUpdateSeverity={updateSeverity}
                severityLevels={severityLevels}
              />
            ))}
          </div>
        )}

        {/* Add Allergy Modal */}
        {showAddModal && (
          <AddAllergyModal
            commonAllergens={commonAllergens}
            severityLevels={severityLevels}
            onAdd={addAllergy}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </div>
  );
}

// Allergy Card Component
function AllergyCard({ allergy, onDelete, onUpdateSeverity, severityLevels }) {
  const getSeverityStyle = (severity) => {
    const level = severityLevels.find(s => s.value === severity);
    return level ? level.color : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{allergy.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{allergy.name}</h3>
            <p className="text-sm text-gray-600">{allergy.category}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(allergy.id)}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="Delete allergy"
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Severity Level</label>
        <select
          value={allergy.severity}
          onChange={(e) => onUpdateSeverity(allergy.id, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {severityLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityStyle(allergy.severity)}`}>
          {severityLevels.find(s => s.value === allergy.severity)?.label}
        </span>
        {allergy.notes && (
          <span className="text-sm text-gray-500" title={allergy.notes}>
            📝
          </span>
        )}
      </div>

      {allergy.notes && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">{allergy.notes}</p>
        </div>
      )}
    </div>
  );
}

// Add Allergy Modal Component
function AddAllergyModal({ commonAllergens, severityLevels, onAdd, onClose }) {
  const [selectedAllergen, setSelectedAllergen] = useState("");
  const [customName, setCustomName] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Environmental");
  const [isCustom, setIsCustom] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const allergenData = isCustom 
      ? {
          name: customName,
          category: category,
          icon: "🔸",
          severity: severity,
          notes: notes
        }
      : {
          ...commonAllergens.find(a => a.name === selectedAllergen),
          severity: severity,
          notes: notes
        };

    onAdd(allergenData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Allergy</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex gap-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!isCustom}
                  onChange={() => setIsCustom(false)}
                  className="mr-2"
                />
                Choose from list
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={isCustom}
                  onChange={() => setIsCustom(true)}
                  className="mr-2"
                />
                Add custom
              </label>
            </div>

            {!isCustom ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Allergen
                </label>
                <select
                  value={selectedAllergen}
                  onChange={(e) => setSelectedAllergen(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose an allergen...</option>
                  {commonAllergens.map((allergen) => (
                    <option key={allergen.name} value={allergen.name}>
                      {allergen.icon} {allergen.name} ({allergen.category})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergen Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter allergen name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Environmental">Environmental</option>
                    <option value="Food">Food</option>
                    <option value="Medication">Medication</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}
          </div>

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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Any additional notes about this allergy..."
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
              Add Allergy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}