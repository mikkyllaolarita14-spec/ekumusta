import { Navigate } from "react-router-dom";

/**
 * @deprecated The account activation flow has been removed.
 * Registration now creates fully activated accounts.
 * This stub only exists so old links don't break — it redirects to /register.
 * Safe to delete this file once nothing links to /activate.
 */
export default function ActivateAccount() {
  return <Navigate to="/register" replace />;
}
