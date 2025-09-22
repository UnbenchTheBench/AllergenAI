"use client";

import Image from "next/image";
import { useAuth } from "../hooks/useAuth";
import AuthModals from "./AuthModals";

function Navbar() {
  const {
    isLoggedIn,
    user,
    loading,
    error,
    showLoginModal,
    showSignUpModal,
    defaultProfileImage,
    handleLogin,
    handleSignUp,
    handleGoogleSignIn,
    handleLogout,
    closeModals,
    openLoginModal,
    openSignUpModal,
    setShowLoginModal,
    setShowSignUpModal,
    setError
  } = useAuth();

  return (
    <>
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold"><Image src="/logo.png" alt="AllergenAI" width={96} height={96} /></a>
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
                    onClick={openLoginModal}
                    className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={openSignUpModal}
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

      <AuthModals
        showLoginModal={showLoginModal}
        showSignUpModal={showSignUpModal}
        loading={loading}
        error={error}
        handleLogin={handleLogin}
        handleSignUp={handleSignUp}
        handleGoogleSignIn={handleGoogleSignIn}
        closeModals={closeModals}
        setShowLoginModal={setShowLoginModal}
        setShowSignUpModal={setShowSignUpModal}
        setError={setError}
      />
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