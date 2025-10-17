import { Navigate } from "react-router-dom";

const isAuthenticated = () => !!localStorage.getItem("user");
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PublicRoute;
