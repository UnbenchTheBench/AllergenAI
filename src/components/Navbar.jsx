"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "../config/firebase";
import SignInWithGoogleButton from "./SignInWithGoogle";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Default guest profile image (you can replace this with your own image URL)
  const defaultProfileImage = "https://via.placeholder.com/150?text=Guest";

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL || defaultProfileImage,
          emailVerified: user.emailVerified
        });
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLoginModal(false);
      console.log("User logged in successfully");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const fullName = formData.get("fullName");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name and set default profile picture
      await updateProfile(userCredential.user, {
        displayName: fullName,
        photoURL: defaultProfileImage // Set default image for email/password users
      });

      setShowSignUpModal(false);
      console.log("User created successfully");
    } catch (error) {
      console.error("Sign up error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = (userData) => {
    setIsLoggedIn(true);
    setUser({
      ...userData,
      photoURL: userData.photoURL || defaultProfileImage // Fallback for Google users too
    });
    setShowLoginModal(false);
    setShowSignUpModal(false);
    console.log("User data received in Navbar:", userData);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setUser(null);
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowSignUpModal(false);
    setError("");
  };

  return (
    <>
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold">AllergenAI</a>
            </div>
            {isLoggedIn ? (
              <div className="hidden md:flex space-x-8">
                <a href="/dashboard" className="hover:text-blue-200 transition-colors">
                  Dashboard
                </a>
                <a href="/myAllergies" className="hover:text-blue-200 transition-colors">
                  My Allergies
                </a>
                <a href="/symptomsLog" className="hover:text-blue-200 transition-colors">
                  Symptoms Log
                </a>
                <a href="/reports" className="hover:text-blue-200 transition-colors">
                  Reports
                </a>
                <a href="/aiAgent" className="hover:text-blue-200 transition-colors">
                  AI Agent
                </a>
              </div>
            ) : null}

            {/* Login/Profile Section */}
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  {/* Always show profile image (either real or default) */}
                  <img 
                    src={user?.photoURL || defaultProfileImage} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border-2 border-blue-300"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.target.src = defaultProfileImage;
                    }}
                  />
                  <span className="text-sm">
                    Welcome, {user?.displayName || user?.email || "User"}!
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowSignUpModal(true)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Login</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {/* Google Sign In Button */}
            <div className="mb-4">
              <SignInWithGoogleButton onSuccess={handleGoogleSignIn} />
            </div>
            
            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-3 text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="flex justify-between space-x-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>
            
            <div className="text-center mt-4">
              <p className="text-gray-600 text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowSignUpModal(true);
                    setError("");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign up here
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign Up</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {/* Google Sign In Button */}
            <div className="mb-4">
              <SignInWithGoogleButton onSuccess={handleGoogleSignIn} />
            </div>
            
            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-3 text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleSignUp}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                  placeholder="Enter your password (min 6 characters)"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                  placeholder="Confirm your password"
                  required
                />
              </div>
              <div className="flex justify-between space-x-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Sign Up"}
                </button>
              </div>
            </form>
            
            <div className="text-center mt-4">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setShowSignUpModal(false);
                    setShowLoginModal(true);
                    setError("");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


export default function returnNavbar() {
  return (
    <div>
      <Navbar />
    </div>
  );
}