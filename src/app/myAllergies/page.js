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
  where 
} from "firebase/firestore";

export default function MyAllergies() {
  const [user, setUser] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <p className="text-gray-600">Manage your allergens (Tree, Weed, Grass).</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Add Allergy Button */}
        {allergies.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Add New Allergy
            </button>
          </div>
        )}

        {/* Allergies Grid */}
        {allergies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">🤧</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Allergies Added Yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your allergens to track them.</p>
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
              />
            ))}
          </div>
        )}

        {/* Add Allergy Modal */}
        {showAddModal && (
          <AddAllergyModal
            existingAllergies={allergies}
            onAdd={addAllergy}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </div>
  );
}

// Allergy Card Component (no severity, no notes)
function AllergyCard({ allergy, onDelete }) {
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
    </div>
  );
}

// Add Allergy Modal Component
function AddAllergyModal({ existingAllergies, onAdd, onClose }) {
  const [selectedAllergen, setSelectedAllergen] = useState("");

 const allergens = [
  // Trees
  { value: "Ash", label: "🌳 Ash", category: "Tree" },
  { value: "Birch", label: "🌳 Birch", category: "Tree" },
  { value: "Cypress/Juniper/Cedar", label: "🌳 Cypress / Juniper / Cedar", category: "Tree" },
  { value: "Elm", label: "🌳 Elm", category: "Tree" },
  { value: "Maple", label: "🌳 Maple", category: "Tree" },
  { value: "Mulberry", label: "🌳 Mulberry", category: "Tree" },
  { value: "Oak", label: "🌳 Oak", category: "Tree" },
  { value: "Pine", label: "🌳 Pine", category: "Tree" },
  { value: "Poplar/Cottonwood", label: "🌳 Poplar / Cottonwood", category: "Tree" },

  // Grasses
  { value: "Grass/Poaceae", label: "🌱 Grasses / Poaceae", category: "Grass" },

  // Weeds
  { value: "Ragweed", label: "🌿 Ragweed", category: "Weed" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAllergen) return;

    const selected = allergens.find(a => a.value === selectedAllergen);
    
    // Default to the category icon if a specific one isn't defined
    const icon = selected.category === "Tree" ? "🌳" : selected.category === "Weed" ? "🌿" : "🌱";
    
    const allergenData = {
      name: selected.value,
      category: selected.category,
      icon,
    };

    onAdd(allergenData);
    setSelectedAllergen("");
  };

  const getAllergenCount = (allergenName) => {
    return existingAllergies.filter((allergy) => allergy.name === allergenName).length;
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Allergy</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
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
              {allergens.map((a) => {
                const count = getAllergenCount(a.value);
                return (
                  <option key={a.value} value={a.value}>
                    {a.label}
                    {count > 0 ? ` (${count} added)` : ""}
                  </option>
                );
              })}
            </select>
            {selectedAllergen && getAllergenCount(selectedAllergen) > 0 && (
              <p className="text-sm text-amber-600 mt-2">
                ℹ️ You already have {getAllergenCount(selectedAllergen)} instance(s) of{" "}
                {selectedAllergen}. You can add it again if needed.
              </p>
            )}
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

// You can keep the rest of your components and logic as they are.
// Just make sure to use this new version of AddAllergyModal.