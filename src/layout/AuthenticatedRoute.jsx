import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const isAuthenticated = () => !!localStorage.getItem("user");
const AuthenticatedRoute = ({ children }) => {
  // const user = useSelector((state) => state.auth.user);

  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" />;
  }

  return children;
};

export default AuthenticatedRoute;

// import React from "react";
// import { Navigate } from "react-router-dom";

// const isAuthenticated = () => !!localStorage.getItem("user");

// const AuthenticatedRoute = ({ children }) => {
//   const authStatus = isAuthenticated();
//   return authStatus ? children : <Navigate to="/auth/login" />;
// };

// export default AuthenticatedRoute;
