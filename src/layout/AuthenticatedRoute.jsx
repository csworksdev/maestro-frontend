import React from "react";
import { Navigate } from "react-router-dom";

const isAuthenticated = () => !!localStorage.getItem("user");

const AuthenticatedRoute = ({ children }) => {
  const authStatus = isAuthenticated();
  return authStatus ? children : <Navigate to="/auth/login" />;
};

export default AuthenticatedRoute;
