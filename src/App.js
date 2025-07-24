import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AdminDashboard from "./Pages/Admindashboard";
import Login from "./Pages/Login";
import AdminUsers from "./Pages/AdminUsers";
import CustomerDashboard from "./Pages/CustomerDashboard";
import { ProtectedRoute } from "./Components/ProtectedRoute";
import { RoleSidebar } from "./Components/RoleSidebar";
import { useAuth } from "./contexts/AuthContext";
import AdminTransportRequests from "./Pages/AdminTransportRequests"; // Import the new component
import EditRequestModal from "./Components/EditRequestModal"; // Import the new component
import AdminLayout from "./Pages/AdminLayout";
import ShipmentsPage from "./Pages/Myshipments";
import ContainerDetailsPage from "./Pages/Containerdetailspage";
import VendorDetails from "./Pages/VendorDetails";
// Add these imports
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Add this import at the top with other imports
import DriverDetails from "./Pages/DriverDetails";
import FleetEquipmentDetails from "./Pages/FleetEquipmentDetails";
import Vindetails from "./Pages/VinDetailsPage";

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const sidebarProps = {
    collapsed,
    toggleSidebar,
    activePage,
    setActivePage,
    mobileMenuOpen,
    toggleMobileMenu,
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <RoleSidebar {...sidebarProps} />

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${
          collapsed ? "md:ml-16" : "md:ml-64"
        } md:min-w-0`}
      >
        <div className="p-6">{React.cloneElement(children, sidebarProps)}</div>
      </main>
    </div>
  );
};

// Component to redirect based on user role
const RoleRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case "Admin":
      return <Navigate to="/admin-dashboard" />;
    case "Customer":
      return <Navigate to="/customer-dashboard" />;
    case "Driver":
      return <Navigate to="/driver-dashboard" />;
    default:
      return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin routes - AdminLayout handles its own sidebar */}
          <Route
            path="/admin-dashboard/*"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <AdminUsers />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/transport-requests"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <AdminTransportRequests />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Customer route */}
          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <CustomerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/my-shipments" // Changed from "/my-shipments"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <ShipmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/container-page" // Changed from "/my-shipments"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <ContainerDetailsPage></ContainerDetailsPage>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-modal"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <EditRequestModal></EditRequestModal>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/vendors"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <VendorDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/drivers"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                  <DriverDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
   <Route
            path="/customer/vinpage"
            element={
              <ProtectedRoute allowedRoles={["Customer"]}>
                <DashboardLayout>
                 <Vindetails></Vindetails>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
<Route
  path="/customer/fleet-equipment"
  element={
    <ProtectedRoute allowedRoles={["Customer"]}>
      <DashboardLayout>
        <FleetEquipmentDetails />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
          

          {/* Driver route */}
          <Route
            path="/driver-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Driver"]}>
                <DashboardLayout>
                  <div>Driver Dashboard (To be implemented)</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  );
}

export default App;

// Add this route inside the Routes component, before the closing </Routes> tag

