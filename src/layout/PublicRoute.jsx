import { Navigate } from "react-router-dom";
import { useIsAuthenticated } from "@/redux/slicers/authSlice";

const PublicRoute = ({ children }) => {
  const isAuth = useIsAuthenticated();

  if (isAuth) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PublicRoute;
