import React from "react";
import { Navigate } from "react-router-dom";

const isAuthenticated = () => !!localStorage.getItem("user");

const PublicRoute = ({ children }) => {
  const authStatus = isAuthenticated();
  return authStatus ? <Navigate to="/app/dashboard" /> : children;
};

export default PublicRoute;
