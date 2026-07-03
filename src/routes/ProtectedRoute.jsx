import { Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { getUserRole, isErpRoute, isSalesRoute } from "../utils/auth";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const role = getUserRole();

  if (!token) return <Navigate to="/" replace />;
  if (role === "SALES" && isErpRoute(location.pathname)) {
    return <Navigate to="/sales/dashboard" replace />;
  }
  if (role === "VIEWER" && isSalesRoute(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
