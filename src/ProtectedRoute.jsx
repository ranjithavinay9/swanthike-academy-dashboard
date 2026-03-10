import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { isAllowedEmail } from "./auth";

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <div style={{ padding: 24 }}>Checking access...</div>;
  }

  if (!user || !isAllowedEmail(user.email)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}