import { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "../config/firebase";

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Default guest profile image
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
        photoURL: defaultProfileImage
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
      photoURL: userData.photoURL || defaultProfileImage
    });
    setShowLoginModal(false);
    setShowSignUpModal(false);
    console.log("User data received:", userData);
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

  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowSignUpModal(false);
    setError("");
  };

  const openSignUpModal = () => {
    setShowSignUpModal(true);
    setShowLoginModal(false);
    setError("");
  };

  return {
    // State
    isLoggedIn,
    user,
    loading,
    error,
    showLoginModal,
    showSignUpModal,
    defaultProfileImage,
    
    // Actions
    handleLogin,
    handleSignUp,
    handleGoogleSignIn,
    handleLogout,
    closeModals,
    openLoginModal,
    openSignUpModal,
    setShowLoginModal,
    setShowSignUpModal
  };
};