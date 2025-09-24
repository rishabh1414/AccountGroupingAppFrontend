import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import useAppStore from "./store/useAppStore";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import ParentsPage from "./pages/ParentsPage";
import ChildrenPage from "./pages/ChildrenPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
console.log("My API URL is:", process.env.REACT_APP_API_URL);
// A component to protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAppStore();
  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after a
    // successful login.
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* All dashboard routes are now wrapped in the ProtectedRoute */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/tech-biz-ceos" replace />} />
          <Route path="tech-biz-ceos" element={<ParentsPage />} />
          <Route path="private-level-end-clients" element={<ChildrenPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="update-password" element={<UpdatePasswordPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
