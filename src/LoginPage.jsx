import React, { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { isAllowedEmail } from "./auth";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user?.email || "";

      if (!isAllowedEmail(email)) {
        await signOut(auth);
        throw new Error("This account is not authorized.");
      }
    } catch (err) {
      setError(err.message || "Login failed.");
    }
  }

  return (
    <div className="login-shell">
      <div className="card">
        <h2>Admin Login</h2>
        <p>Sign in with your approved Google account.</p>
        {error ? <div className="alert error">{error}</div> : null}
        <button className="primary-button" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}