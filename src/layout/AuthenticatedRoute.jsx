import { Navigate } from "react-router-dom";
import { useIsAuthenticated } from "@/redux/slicers/authSlice";

// const isAuthenticated = () => !!localStorage.getItem("user");
const AuthenticatedRoute = ({ children }) => {
  const isAuth = useIsAuthenticated();

  if (!isAuth) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

export default AuthenticatedRoute;
