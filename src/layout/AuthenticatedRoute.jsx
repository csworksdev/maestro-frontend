import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

// const isAuthenticated = () => !!localStorage.getItem("user");
const AuthenticatedRoute = ({ children }) => {
  // const navigate = useNavigate();
  const authState = useSelector((state) => state.auth);

  if (!authState.isAuth) {
    return <Navigate to="/auth/login" replace />;
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
