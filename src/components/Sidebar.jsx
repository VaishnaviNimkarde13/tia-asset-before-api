import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, ButtonBase, Divider, Avatar, Collapse, useMediaQuery, useTheme, Drawer, IconButton } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";

import {
  DashboardIcon, InventoryIcon, ShoppingCartIcon, PurchaseOrderIcon,
  GoodsReceiptIcon, StockIssueIcon, TransfersIcon, ExpiryTrackingIcon,
  ReplacementIcon, ReportsIcon, AdminOverviewIcon, UsersIcon, LocationIcon,
  CategoriesIcon, DocumentsIcon, SuppliersIcon, ManufacturersIcon,
  AuditLogIcon, SettingsIcon as SidebarSettingsIcon, ConsumptionDamagedIcon,
} from "../assets/Icons";

import { LogoIcon } from "../assets/Assets";
import { useAuth, canAccess } from "../contexts/Authcontext";


const ALL_NAV_ITEMS = [
  { icon: <DashboardIcon />,      label: "Dashboard",          path: "/admin/dashboard" },
  { icon: <InventoryIcon />,      label: "Inventory Items",    path: "/admin/inventory/items" },
  { icon: <ShoppingCartIcon />,   label: "Indent/Procurement", path: "/admin/inventory/indent" },
  { icon: <PurchaseOrderIcon />,  label: "Purchase Orders",    path: "/admin/purchase-orders" },
  { icon: <GoodsReceiptIcon />,   label: "Goods Receipt",      path: "/admin/goods-receipt" },
  { icon: <StockIssueIcon />,     label: "Stock Issue",        path: "/admin/stock-issue" },
  { icon: <TransfersIcon />,      label: "Transfers",          path: "/admin/transfers" },
  { icon: <ExpiryTrackingIcon />, label: "Expiry Tracking",    path: "/admin/expiry-tracking" },
  { icon: <DeleteOutlineIcon />,  label: "Disposed Items",     path: "/admin/disposed-items" },
  { icon: <ReplacementIcon />,    label: "Replacement",        path: "/admin/replacement", badge: 1 },
  { icon: <ConsumptionDamagedIcon />, label: "Consumption & Damaged", path: "/admin/consumption-damaged-items" },
  { icon: <ReportsIcon />,        label: "Reports",            path: "/admin/reports" },
];

const ALL_ADMIN_ITEMS = [
  { icon: <AdminOverviewIcon />,   label: "Admin Overview",       path: "/admin/overview" },
  { icon: <UsersIcon />,           label: "Users & Roles",        path: "/admin/users" },
  { icon: <LocationIcon />,        label: "Locations/Department", path: "/admin/locations" },
  { icon: <CategoriesIcon />,      label: "Categories",           path: "/admin/categories" },
  { icon: <DocumentsIcon />,       label: "Documents",            path: "/admin/documents" },
  { icon: <SuppliersIcon />,       label: "Vendor Management",    path: "/admin/vendor-management" },
  { icon: <AuditLogIcon />,        label: "Audit Log",            path: "/admin/audit-log" },
  { icon: <SidebarSettingsIcon />, label: "Settings",             path: "/admin/system-settings" },
];

function NavButton({ item, active, onClick }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: "flex", alignItems: "center", justifyContent: "flex-start",
        gap: 1.2, px: 2.5, py: 1.1, width: "100%",
        bgcolor: active ? "#ede9fe" : "transparent",
        outline: "none",
        "&:focus, &:focus-visible": { outline: "none" },
        transition: "background 0.15s",
        "&:hover": {
          bgcolor: active ? "#ede9fe" : "#f5f5f5",
          "& .nav-icon":  { color: "#6366f1" },
          "& .nav-label": { color: "#6366f1" },
        },
      }}
    >
      <Box className="nav-icon"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center",
          color: active ? "#6366f1" : "#999", flexShrink: 0, transition: "color 0.15s",
          width: 20, height: 20, "& svg": { width: "100%", height: "100%" } }}>
        {item.icon}
      </Box>

      <Typography className="nav-label"
        sx={{ fontSize: 13, fontWeight: active ? 700 : 500,
          color: active ? "#6366f1" : "#666", lineHeight: 1,
          transition: "color 0.15s", textAlign: "left", flex: 1 }}>
        {item.label}
      </Typography>

      {item.badge && (
        <Box sx={{ minWidth: 18, height: 18, borderRadius: "9px", bgcolor: "#3b82f6",
          color: "#fff", fontSize: 11, fontWeight: 600, display: "flex",
          alignItems: "center", justifyContent: "center", px: "5px", lineHeight: 1, flexShrink: 0 }}>
          {item.badge}
        </Box>
      )}
    </ButtonBase>
  );
}

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

 const role = currentUser?.role || "";

const navItems = ALL_NAV_ITEMS;

const adminItems = ALL_ADMIN_ITEMS.filter(item => canAccess(role, item.path));

  const isActive = (path) => location.pathname === path;

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleProfileClick = () => {
    setMenuOpen(!menuOpen);
  };

  const handleSettings = () => {
    navigate("/user/settings");
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar - Always Visible */}
      {isDesktop && (
        <Box sx={{
          width: 220, minWidth: 220, height: "100vh",
          bgcolor: "#fff", borderRight: "1px solid #ececec",
          display: "flex", flexDirection: "column",
          overflow: "hidden", flexShrink: 0, py: 2.5,
        }}>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, pb: 3, flexShrink: 0 }}>
            <LogoIcon />
          </Box>

          {/* Scrollable nav */}
          <Box sx={{
            flex: 1, overflowY: "auto", overflowX: "hidden",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
            "&::-webkit-scrollbar-thumb:hover": { background: "#a1a1aa" },
          }}>
            {navItems.map((item) => (
              <NavButton key={item.label} item={item} active={isActive(item.path)}
                onClick={() => navigate(item.path)} />
            ))}

            {adminItems.length > 0 && (
              <>
                <Divider sx={{ mx: 2.5, my: 1.5 }} />
                {adminItems.map((item) => (
                  <NavButton key={item.label} item={item} active={isActive(item.path)}
                    onClick={() => navigate(item.path)} />
                ))}
              </>
            )}
          </Box>

          {/* ── User profile pinned at bottom ── */}
          {currentUser && (
            <>
              <Divider sx={{ mx: 2.5, mt: 1 }} />
              <Box
                onClick={handleProfileClick}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.2,
                  px: 2.5, py: 1.5, mt: 0.5, cursor: "pointer",
                  borderRadius: 0,
                  transition: "background 0.15s",
                  "&:hover": { bgcolor: "#f5f5f5" },
                  flexShrink: 0,
                }}
              >
                <Avatar
                  sx={{ width: 32, height: 32, bgcolor: "#6366f1", fontSize: 13, fontWeight: 700, flexShrink: 0 }}
                >
                  {initials}
                </Avatar>

                <Box sx={{ overflow: "hidden", flex: 1 }}>
                  <Typography sx={{
                    fontSize: 13, fontWeight: 600, color: "#111827",
                    lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {currentUser.name}
                  </Typography>
                  
                  {/* Role - Line 1 */}
                  <Typography sx={{ 
                    fontSize: 11, color: "#9ca3af", lineHeight: 1.3, 
                    textTransform: "capitalize", whiteSpace: "nowrap", 
                    overflow: "hidden", textOverflow: "ellipsis", mt: 0.3
                  }}>
                    {(currentUser.role || "").replace("_", " ")}
                  </Typography>
                  
                  {/* Location - Line 2 (if exists) */}
                  {currentUser.locationName && (
                    <Typography sx={{ 
                      fontSize: 11, color: "#6b7280", lineHeight: 1.3,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", mt: 0.2
                    }}>
                      {currentUser.locationName}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Inline Menu with animation */}
              <Collapse in={menuOpen} timeout="auto" unmountOnExit>
                <Box sx={{ px: 1, py: 0.5, mb: 1 }}>
                  <ButtonBase
                    onClick={handleSettings}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5,
                      width: "100%", px: 2.5, py: 1.2,
                      borderRadius: 1.5, fontSize: 13,
                      transition: "background 0.15s",
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <SettingsIcon sx={{ fontSize: 18, color: "#666" }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#333", flex: 1, textAlign: "left" }}>
                      Account Settings
                    </Typography>
                  </ButtonBase>

                  <ButtonBase
                    onClick={handleLogout}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5,
                      width: "100%", px: 2.5, py: 1.2,
                      borderRadius: 1.5, fontSize: 13,
                      transition: "background 0.15s",
                      "&:hover": { bgcolor: "#fef2f2" },
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#ef4444", flex: 1, textAlign: "left" }}>
                      Logout
                    </Typography>
                  </ButtonBase>
                </Box>
              </Collapse>
            </>
          )}
        </Box>
      )}

      {/* Mobile/Tablet Header with Menu Button */}
      {!isDesktop && (
        <Box sx={{
          display: "flex", alignItems: "center", gap: 2,
          p: "12px 16px", bgcolor: "#fff", borderBottom: "1px solid #e5e7eb",
          minHeight: 56, flexShrink: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          <IconButton
            size="medium"
            onClick={() => setSidebarOpen(true)}
            sx={{ 
              color: "#6366f1",
              padding: "8px",
              "&:hover": {
                bgcolor: "#ede9fe",
              },
              transition: "all 0.2s",
            }}
          >
            <MenuIcon sx={{ fontSize: 24 }} />
          </IconButton>
        </Box>
      )}

      {/* Mobile/Tablet Drawer Sidebar */}
      {!isDesktop && (
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: 280,
              boxSizing: "border-box",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            },
          }}
        >
          <Box sx={{
            bgcolor: "#fff",
            display: "flex", flexDirection: "column",
            height: "100%",
            py: 0,
          }}>
            {/* Drawer Header with Logo and Close Button */}
            <Box sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              px: 2.5,
              py: 2,
              borderBottom: "1px solid #e5e7eb",
            }}>
              <LogoIcon />
              <IconButton
                size="small"
                onClick={() => setSidebarOpen(false)}
                sx={{
                  color: "#9ca3af",
                  padding: "4px",
                  "&:hover": {
                    bgcolor: "#f3f4f6",
                    color: "#6366f1",
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Scrollable nav */}
            <Box sx={{
              flex: 1, overflowY: "auto", overflowX: "hidden",
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: 4 },
              "&::-webkit-scrollbar-thumb:hover": { background: "#a1a1aa" },
            }}>
              {navItems.map((item) => (
                <NavButton 
                  key={item.label} 
                  item={item} 
                  active={isActive(item.path)}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }} 
                />
              ))}

              {adminItems.length > 0 && (
                <>
                  <Divider sx={{ mx: 2.5, my: 1.5 }} />
                  {adminItems.map((item) => (
                    <NavButton 
                      key={item.label} 
                      item={item} 
                      active={isActive(item.path)}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }} 
                    />
                  ))}
                </>
              )}
            </Box>

            {/* ── User profile pinned at bottom ── */}
            {currentUser && (
              <>
                <Divider sx={{ mx: 2.5, mt: 1 }} />
                <Box
                  onClick={handleProfileClick}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1.2,
                    px: 2.5, py: 1.5, mt: 0.5, cursor: "pointer",
                    borderRadius: 0,
                    transition: "background 0.15s",
                    "&:hover": { bgcolor: "#f5f5f5" },
                    flexShrink: 0,
                  }}
                >
                  <Avatar
                    sx={{ width: 32, height: 32, bgcolor: "#6366f1", fontSize: 13, fontWeight: 700, flexShrink: 0 }}
                  >
                    {initials}
                  </Avatar>

                  <Box sx={{ overflow: "hidden", flex: 1 }}>
                    <Typography sx={{
                      fontSize: 13, fontWeight: 600, color: "#111827",
                      lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {currentUser.name}
                    </Typography>
                    
                    {/* Role - Line 1 */}
                    <Typography sx={{ 
                      fontSize: 11, color: "#9ca3af", lineHeight: 1.3, 
                      textTransform: "capitalize", whiteSpace: "nowrap", 
                      overflow: "hidden", textOverflow: "ellipsis", mt: 0.3
                    }}>
                      {(currentUser.role || "").replace("_", " ")}
                    </Typography>
                    
                    {/* Location - Line 2 (if exists) */}
                    {currentUser.locationName && (
                      <Typography sx={{ 
                        fontSize: 11, color: "#6b7280", lineHeight: 1.3,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", mt: 0.2
                      }}>
                        {currentUser.locationName}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Inline Menu with animation */}
                <Collapse in={menuOpen} timeout="auto" unmountOnExit>
                  <Box sx={{ px: 1, py: 0.5, mb: 1 }}>
                    <ButtonBase
                      onClick={handleSettings}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.5,
                        width: "100%", px: 2.5, py: 1.2,
                        borderRadius: 1.5, fontSize: 13,
                        transition: "background 0.15s",
                        "&:hover": { bgcolor: "#f5f5f5" },
                      }}
                    >
                      <SettingsIcon sx={{ fontSize: 18, color: "#666" }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#333", flex: 1, textAlign: "left" }}>
                        Account Settings
                      </Typography>
                    </ButtonBase>

                    <ButtonBase
                      onClick={handleLogout}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.5,
                        width: "100%", px: 2.5, py: 1.2,
                        borderRadius: 1.5, fontSize: 13,
                        transition: "background 0.15s",
                        "&:hover": { bgcolor: "#fef2f2" },
                      }}
                    >
                      <LogoutIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#ef4444", flex: 1, textAlign: "left" }}>
                        Logout
                      </Typography>
                    </ButtonBase>
                  </Box>
                </Collapse>
              </>
            )}
          </Box>
        </Drawer>
      )}
    </>
  );
}