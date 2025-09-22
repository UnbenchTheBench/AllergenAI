import SignInWithGoogleButton from "./SignInWithGoogle";

export default function AuthModals({
  showLoginModal,
  showSignUpModal,
  loading,
  error,
  handleLogin,
  handleSignUp,
  handleGoogleSignIn,
  closeModals,
  setShowLoginModal,
  setShowSignUpModal,
  setError
}) {
  return (
    <>
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