import React from "react";
import { Navigate } from "react-router-dom";

const isAuthenticated = () => !!localStorage.getItem("user");

const AuthenticatedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

export default AuthenticatedRoute;
