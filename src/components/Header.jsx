

import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, Box } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard/dashboard";
import AddItem from "./pages/Dashboard/additem";
import InventoryItems from "./pages/InventoryItems";
import GoodsReceipt from "./pages/GoodsReceipt";
import IndentProcurement from "./pages/IndentProcurement";
import PurchaseOrders from "./pages/PurchaseOrders";
import ExpiryTracking from "./pages/ExpiryTracking";
import ItemDispose from "./pages/ItemDispose";
import Replacement from "./pages/Replacement";
import Transfers from "./pages/Transfers";
import DocumentManagement from "./pages/DocumentManagement";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import StockIssue from "./pages/StockIssue";
import Categories from "./pages/Categories";
import AuditLog from "./pages/AuditLog";
import SystemSettings from "./pages/SystemSettings";
import VendorManagement from "./pages/VendorManagement";
import AdminOverview from "./pages/AdminOverview";
import UsersRoles from "./pages/UsersRoles";
import Locations from "./pages/Locations";
import UserSettings from "./pages/UserSettings";
import ConsumptionDamagedItems from "./pages/ConsumptionDamagedItems";
import { InventoryProvider } from "./contexts/InventoryContext";
import { GRNProvider } from "./contexts/GRNContext";
import { VendorManagementProvider } from "./contexts/VendorManagementContext";
import { AuthProvider, useAuth, ROLE_PERMISSIONS } from "./contexts/Authcontext";
import { initializeSuppliers } from "./utils/supplierUtils";
import { initializeManufacturers } from "./utils/manufacturerUtils";
import { initializeGPOs } from "./utils/gpoUtils";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
  },
});

const PrivateRoute = ({ children, path }) => {
  const { currentUser } = useAuth();

  if (!currentUser) return <Navigate to="/" replace />;

  return children;
};

const TitleUpdater = () => {
  const { pathname } = window.location;
  const titles = {
    "/admin/dashboard": "Dashboard",
    "/admin/goods-receipt": "Goods Receipt",
    "/admin/inventory/add": "Add Item",
    "/admin/inventory/items": "Inventory Items",
    "/admin/stock-issue": "Stock Issue",
    "/admin/transfers": "Transfers",
    "/admin/expiry-tracking": "Expiry Tracking",
    "/admin/disposed-items": "Disposed Items",
    "/admin/replacement": "Replacement",
    "/admin/inventory/indent": "Indent & Procurement",
    "/admin/purchase-orders": "Purchase Orders",
    "/admin/documents": "Documents",
    "/admin/consumption-damaged-items": "Consumption/Damaged Items",
    "/admin/reports": "Reports & Analytics",
    "/admin/categories": "Categories",
    "/admin/audit-log": "Audit Log",
    "/admin/system-settings": "System Settings",
    "/admin/vendor-management": "Vendor Management",
    "/admin/overview": "Admin Overview",
    "/admin/users": "Users & Roles",
    "/admin/locations": "Locations",
    "/user/settings": "User Settings",
  };

  useEffect(() => {
    document.title = titles[pathname] || "Inventory Management System";
  }, [pathname, titles]);

  return null;
};

const DashboardLayout = ({ children }) => (
  <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
    <Sidebar />
    <Box sx={{ flex: 1, bgcolor: "#f5f6fa", overflowY: "auto", p: 3.5 }}>
      {children}
    </Box>
  </Box>
);

const PR = ({ path, children }) => (
  <PrivateRoute path={path}>
    <DashboardLayout>{children}</DashboardLayout>
  </PrivateRoute>
);

function App() {
  useEffect(() => {
    initializeSuppliers();
    initializeManufacturers();
    initializeGPOs();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <VendorManagementProvider>
            <InventoryProvider>
              <GRNProvider>
                <TitleUpdater />
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Login />} />

                  {/* Protected */}
                  <Route path="/admin/dashboard" element={<PR path="/admin/dashboard"><Dashboard /></PR>} />
                  <Route path="/admin/goods-receipt" element={<PR path="/admin/goods-receipt"><GoodsReceipt /></PR>} />
                  <Route path="/admin/inventory/add" element={<PR path="/admin/inventory/items"><AddItem /></PR>} />
                  <Route path="/admin/inventory/items" element={<PR path="/admin/inventory/items"><InventoryItems /></PR>} />
                  <Route path="/admin/replacement" element={<PR path="/admin/replacement"><Replacement /></PR>} />
                  <Route path="/admin/inventory/indent" element={<PR path="/admin/inventory/indent"><IndentProcurement /></PR>} />
                  <Route path="/admin/purchase-orders" element={<PR path="/admin/purchase-orders"><PurchaseOrders /></PR>} />
                  <Route path="/admin/expiry-tracking" element={<PR path="/admin/expiry-tracking"><ExpiryTracking /></PR>} />
                  <Route path="/admin/disposed-items" element={<PR path="/admin/disposed-items"><ItemDispose /></PR>} />
                  <Route path="/admin/transfers" element={<PR path="/admin/transfers"><Transfers /></PR>} />
                  <Route path="/admin/documents" element={<PR path="/admin/documents"><DocumentManagement /></PR>} />
                  <Route path="/admin/consumption-damaged-items" element={<PR path="/admin/consumption-damaged-items"><ConsumptionDamagedItems /></PR>} />
                  <Route path="/admin/reports" element={<PR path="/admin/reports"><ReportsAnalytics /></PR>} />
                  <Route path="/admin/stock-issue" element={<PR path="/admin/stock-issue"><StockIssue /></PR>} />
                  <Route path="/admin/categories" element={<PR path="/admin/categories"><Categories /></PR>} />
                  <Route path="/admin/audit-log" element={<PR path="/admin/audit-log"><AuditLog /></PR>} />
                  <Route path="/admin/system-settings" element={<PR path="/admin/system-settings"><SystemSettings /></PR>} />
                  <Route path="/admin/vendor-management" element={<PR path="/admin/vendor-management"><VendorManagement /></PR>} />

                  {/* Admin-only routes */}
                  <Route path="/admin/overview" element={<PR path="/admin/overview"><AdminOverview /></PR>} />
                  <Route path="/admin/users" element={<PR path="/admin/users"><UsersRoles /></PR>} />
                  <Route path="/admin/locations" element={<PR path="/admin/locations"><Locations /></PR>} />

                  {/* User settings */}
                  <Route path="/user/settings" element={<PR path="/user/settings"><UserSettings /></PR>} />
                </Routes>
              </GRNProvider>
            </InventoryProvider>
          </VendorManagementProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;