import React from "react";
import { Navigate } from "react-router-dom";

const isAuthenticated = () => !!localStorage.getItem("user");

const PublicRoute = ({ children }) => {
  return isAuthenticated() ? <Navigate to="/dashboard" /> : children;
};

export default PublicRoute;
