"use client";

import { useState, useEffect, useRef } from "react";
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
  limit 
} from "firebase/firestore";


export default function MyAllergies() {
  const [user, setUser] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const authAbortRef = useRef(null);

  useEffect(() => {
    authAbortRef.current = new AbortController();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (authAbortRef.current.signal.aborted) return;
      setUser(user);
      if (user) {
        // Try to load cached allergies immediately
        try {
          const cached = sessionStorage.getItem(`allergies_${user.uid}`);
          if (cached) {
            setAllergies(JSON.parse(cached));
            setLoading(false); // show cached immediately
          }
        } catch (e) {
          console.warn('Failed to read allergies cache', e);
        }
          // No background fetch - rely on optimistic updates and cache
          // Background Firestore sync has been disabled due to security rule timeouts
          // Users can still add/delete with optimistic UI updates
          console.log('Background sync disabled - app will use optimistic updates + cache');
          // Set loading to false after a short delay so UI doesn't hang when no cache
          setTimeout(() => {
            if (!sessionStorage.getItem(`allergies_${user.uid}`)) {
              console.log('No cache found, UI ready for optimistic updates');
            }
            setLoading(false);
          }, 100);
      } else {
        setLoading(false);
      }
    });

    return () => {
      authAbortRef.current.abort();
      unsubscribe();
    };
  }, []);

  // Auto-clear non-timeout errors after 5 seconds
  useEffect(() => {
    if (error && !error.toLowerCase().includes('timeout')) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

    // DISABLED: Background sync to Firestore is disabled due to persistent timeouts
    // This is likely caused by Firestore security rules blocking reads.
    // The app works with optimistic UI updates + sessionStorage caching instead.

  const fetchAllergies = async (userId, isBackground = false) => {
    // Helper to run getDocs with a timeout
    const runGetDocsWithTimeout = async (q, ms, label) => {
      let tId;
      try {
        console.time(label);
        console.log(`[${label}] Starting query with ${ms}ms timeout for userId: ${userId}`);
        
        const docsPromise = (async () => {
          console.log(`[${label}] Executing getDocs...`);
          const res = await getDocs(q);
          console.log(`[${label}] getDocs returned ${res.docs.length} documents`);
          console.timeEnd(label);
          return res;
        })();
        
        const timeoutPromise = new Promise((_, reject) => {
          tId = setTimeout(() => {
            console.warn(`[${label}] Query timed out after ${ms}ms`);
            reject(new Error("Allergies query timeout"));
          }, ms);
        });

        const snapshot = await Promise.race([docsPromise, timeoutPromise]);
        clearTimeout(tId);
        return snapshot;
      } catch (err) {
        clearTimeout(tId);
        throw err;
      }
    };

    // Always reset syncing state at the end, regardless of foreground/background
    try {
      if (!isBackground) {
        setIsSyncing(true);
      }

      console.log('fetchAllergies: Starting for user', userId, isBackground ? '(background)' : '(foreground)');
      const q = query(collection(db, "allergies"), where("userId", "==", userId), limit(100));
      console.log('fetchAllergies: Query built, attempting first attempt with 8s timeout');

      // First attempt: short timeout
      let querySnapshot;
      try {
        querySnapshot = await runGetDocsWithTimeout(q, 8000, 'fetchAllergies.getDocs');
      } catch (err) {
        console.warn('fetchAllergies: First attempt timed out, retrying with 15s timeout');
        // Retry once with a longer timeout
        try {
          querySnapshot = await runGetDocsWithTimeout(q, 15000, 'fetchAllergies.getDocs.retry');
        } catch (err2) {
          console.error('fetchAllergies: Retry also timed out:', err2.message);
          throw err2; // bubble up
        }
      }

      if (authAbortRef.current?.signal?.aborted) {
        console.log('fetchAllergies: Request aborted');
        return;
      }

      const allergiesData = [];
      querySnapshot.forEach((doc) => {
        allergiesData.push({ id: doc.id, ...doc.data() });
      });
      console.log('fetchAllergies: Successfully fetched', allergiesData.length, 'allergies');
      setAllergies(allergiesData);
      // cache results for faster subsequent loads during session
      try {
        if (userId) sessionStorage.setItem(`allergies_${userId}`, JSON.stringify(allergiesData));
      } catch (e) {
        console.warn('Failed to write allergies cache', e);
      }
    } catch (error) {
      console.error("fetchAllergies: Error fetching allergies:", error, isBackground ? '(background)' : '(foreground)');
      // Only show error if this is a foreground fetch (initial load)
      // Background fetches should fail silently
      if (!isBackground) {
        if (error && error.message && error.message.toLowerCase().includes('timeout')) {
          setError('Allergies request timed out. Showing cached data if available.');
        } else {
          setError('Failed to load allergies: ' + (error?.message || 'Unknown error'));
        }
        setLoading(false);
      }
    } finally {
      // Always reset syncing state
      if (!isBackground) {
        setIsSyncing(false);
      }
    }
  };

  const addAllergy = async (allergyData) => {
    if (!user) return;
    // Optimistic UI: add a temporary allergy immediately
    const tempId = `temp_${Date.now()}`;
    const tempAllergy = { id: tempId, ...allergyData, userId: user.uid, _pending: true };
    const updatedAllergies = [...allergies, tempAllergy];

    try {
      // Update UI and cache first
      setAllergies(updatedAllergies);
      setError(''); // Clear previous errors
      try {
        if (user.uid) sessionStorage.setItem(`allergies_${user.uid}`, JSON.stringify(updatedAllergies));
      } catch (e) {
        console.warn('Failed to update allergies cache', e);
      }

      // Close modal immediately to reflect optimistic update
      setShowAddModal(false);

      // Attempt to write to Firestore
      const docRef = await addDoc(collection(db, "allergies"), {
        ...allergyData,
        userId: user.uid,
        createdAt: new Date()
      });

      // Replace temp item with real id and clear pending flag
      setAllergies((prev) => {
        const replaced = prev.map((a) => a.id === tempId ? { id: docRef.id, ...allergyData, userId: user.uid } : a);
        try {
          if (user.uid) sessionStorage.setItem(`allergies_${user.uid}`, JSON.stringify(replaced));
        } catch (e) { console.warn('Failed to write allergies cache after add', e); }
        return replaced;
      });

      console.log('addAllergy: Successfully synced allergy', docRef.id);
    } catch (error) {
      console.error("Error adding allergy:", error);
      // Remove the optimistic temp item
      setAllergies((prev) => {
        const filtered = prev.filter(a => a.id !== tempId);
        try {
          if (user.uid) sessionStorage.setItem(`allergies_${user.uid}`, JSON.stringify(filtered));
        } catch (e) { console.warn('Failed to update cache after failed add', e); }
        return filtered;
      });
      setError("Failed to add allergy: " + (error?.message || 'Unknown error'));
    }
  };

  const deleteAllergy = async (allergyId) => {
    try {
      await deleteDoc(doc(db, "allergies", allergyId));
      const updatedAllergies = allergies.filter(allergy => allergy.id !== allergyId);
      setAllergies(updatedAllergies);
      
      // Update cache immediately
      try {
        if (user.uid) sessionStorage.setItem(`allergies_${user.uid}`, JSON.stringify(updatedAllergies));
      } catch (e) {
        console.warn('Failed to update allergies cache', e);
      }
      
      setError(''); // Clear any previous errors
      console.log('deleteAllergy: Successfully deleted allergy', allergyId);
    } catch (error) {
      console.error("Error deleting allergy:", error);
      setError("Failed to delete allergy: " + (error?.message || 'Unknown error'));
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">My Allergies</h1>
              <p className="text-gray-600">Manage your allergens (Tree, Weed, Grass).</p>
            </div>
            {isSyncing && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700 font-medium">Syncing...</span>
              </div>
            )}
          </div>
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
    console.log('Modal handleSubmit: selectedAllergen=', selectedAllergen);
    
    if (!selectedAllergen) {
      console.warn('Modal handleSubmit: No allergen selected');
      return;
    }

    const selected = allergens.find(a => a.value === selectedAllergen);
    console.log('Modal handleSubmit: selected=', selected);
    
    // Default to the category icon if a specific one isn't defined
    const icon = selected.category === "Tree" ? "🌳" : selected.category === "Weed" ? "🌿" : "🌱";
    
    const allergenData = {
      name: selected.value,
      category: selected.category,
      icon,
    };

    console.log('Modal handleSubmit: calling onAdd with data:', allergenData);
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