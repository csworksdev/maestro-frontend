import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const isAuthenticated = () => !!localStorage.getItem("user");
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/app/dashboard" />;
  }

  return children;
};

export default PublicRoute;

// import React from "react";
// import { Navigate } from "react-router-dom";

// const isAuthenticated = () => !!localStorage.getItem("user");

// const PublicRoute = ({ children }) => {
//   const authStatus = isAuthenticated();
//   return authStatus ? <Navigate to="/app/dashboard" /> : children;
// };

// export default PublicRoute;
