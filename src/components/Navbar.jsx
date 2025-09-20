"use client";

import Image from "next/image";
import { useState } from "react";
import SignInWithGoogleButton from "./SignInWithGoogle";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = () => {
    // Mock login functionality
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <>
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <span className="text-xl font-bold">Over the weather</span>
            </div>
            {isLoggedIn ? (
  <div className="hidden md:flex space-x-8">
    <a href="#dashboard" className="hover:text-blue-200 transition-colors">
      Dashboard
    </a>
    <a href="#allergies" className="hover:text-blue-200 transition-colors">
      My Allergies
    </a>
    <a href="#symptoms" className="hover:text-blue-200 transition-colors">
      Symptoms Log
    </a>
    <a href="#reports" className="hover:text-blue-200 transition-colors">
      Reports
    </a>
  </div>
) : null}

            {/* Login/Profile Section */}
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm">Welcome, User!</span>
                  <button
                    onClick={handleLogout}
                    className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
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
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
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
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Login
                </button>

                <SignInWithGoogleButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome to AllerTrack</h1>
        <p className="text-gray-600 mt-4">Track and manage your allergies effectively.</p>
      </div>
    </div>
  );
}