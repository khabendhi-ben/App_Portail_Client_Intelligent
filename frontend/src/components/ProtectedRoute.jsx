import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const mustChange = localStorage.getItem("must_change_password");
  if (mustChange === "true") {
    return <Navigate to="/change-password-required" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Si l'utilisateur n'a pas le rôle autorisé, on le redirige vers l'accueil
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;