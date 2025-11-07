// src/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token =
    localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

  // If no token, redirect to /auth
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  // Otherwise, show the protected page
  return children;
};

export default ProtectedRoute;
