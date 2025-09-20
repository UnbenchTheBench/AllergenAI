"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import Image from "next/image";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Logged-in user view
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto py-16 px-4">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome back, {user.displayName || user.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Ready to track your allergies and stay healthy?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <a 
              href="/Dashboard"
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-center group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">View Dashboard</h3>
              <p className="text-gray-600">Check your health overview and today's conditions</p>
            </a>
            
            <a 
              href="/symptomsLog"
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-center group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📝</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Log Symptoms</h3>
              <p className="text-gray-600">Record your symptoms and track patterns</p>
            </a>
            
            <a 
              href="/myAllergies"
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-center group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Allergies</h3>
              <p className="text-gray-600">Update your allergy profile and preferences</p>
            </a>
          </div>

          {/* Recent Activity Preview */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Health Journey</h2>
            <p className="text-gray-600 mb-6">
              Continue monitoring your allergies and symptoms to better understand your patterns
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="/reports"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                View Reports
              </a>
              <a 
                href="/Dashboard"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-logged-in user view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto py-20 px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Take Control of Your <span className="text-blue-600">Allergies</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Track symptoms, monitor environmental conditions, and get personalized insights 
            to manage your allergies more effectively.
          </p>
          <div className="space-x-4">
            <a 
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Get Started Free
            </a>
            <a 
              href="/login"
              className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-blue-600 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Smart Dashboard</h3>
            <p className="text-gray-600">
              Get real-time weather, pollen counts, and air quality data alongside your symptom tracking.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Symptom Tracking</h3>
            <p className="text-gray-600">
              Log your symptoms easily and track patterns to identify triggers and peak seasons.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Detailed Reports</h3>
            <p className="text-gray-600">
              Generate comprehensive reports to share with your healthcare provider.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-lg p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Why Choose Our Allergy Tracker?
              </h2>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span>Real-time environmental data integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span>Personalized allergy management insights</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span>Easy symptom logging and pattern recognition</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span>Comprehensive reporting for healthcare providers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span>Secure and private health data storage</span>
                </li>
              </ul>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-6">🌟</div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Start Your Journey Today
              </h3>
              <p className="text-gray-600 mb-6">
                Join thousands of users who are taking control of their allergies
              </p>
              <a 
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Free Account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
