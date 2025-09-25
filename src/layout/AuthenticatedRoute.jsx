import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

// const isAuthenticated = () => !!localStorage.getItem("user");
const AuthenticatedRoute = ({ children }) => {
  const authState = useSelector((state) => state.auth);

  if (!authState.isAuth) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

export default AuthenticatedRoute;
