import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "primereact/button";
import useAppStore from "../../store/useAppStore";
import "./AppLayout.css";

import FloatingTimer from "../scheduler/FloatingTimer";

const AppLayout = () => {
  // removed setIsCollapsed to avoid ESLint warning about unused var
  const [isCollapsed] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const { logout, user } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { icon: "pi pi-fw pi-users", label: "TechBizCEOs", to: "/tech-biz-ceos" },
    {
      icon: "pi pi-fw pi-sitemap",
      label: "Private Label End Clients",
      to: "/private-level-end-clients",
    },
    { icon: "pi pi-fw pi-history", label: "Audit Logs", to: "/audit-logs" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-column h-full bg-gray-800">
      <div className="sidebar-header">
        <i className="pi pi-briefcase"></i>
        <span className="app-name">TechBizCEO</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className="nav-link"
            onClick={() => setMobileVisible(false)}
            title={isCollapsed ? item.label : ""}
          >
            <i className={item.icon}></i>
            <span className="nav-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="p-2 border-top-1 border-gray-700">
          <NavLink
            to="/update-password"
            className="nav-link"
            title="Update Password"
          >
            <i className="pi pi-fw pi-cog"></i>
            <span className="nav-link-label">Settings</span>
          </NavLink>
          <div
            className="nav-link"
            onClick={handleLogout}
            style={{ cursor: "pointer" }}
            title="Logout"
          >
            <i className="pi pi-fw pi-sign-out"></i>
            <span className="nav-link-label">Logout</span>
          </div>
        </div>
        <div className="p-3 border-top-1 border-gray-700 flex align-items-center">
          <i className="pi pi-user-circle" style={{ fontSize: "2rem" }}></i>
          {!isCollapsed && (
            <div className="ml-2">
              <div className="font-bold text-white">{user?.username}</div>
              <div className="text-sm text-gray-400">{user?.role}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const isParentsPage = location.pathname.startsWith("/parents");

  return (
    <div className="app-layout">
      <div
        className={`sidebar hidden lg:flex ${isCollapsed ? "collapsed" : ""}`}
      >
        <SidebarContent />
      </div>
      <div
        className={`sidebar lg:hidden ${mobileVisible ? "mobile-visible" : ""}`}
      >
        <SidebarContent />
      </div>
      {mobileVisible && (
        <div
          className="lg:hidden fixed top-0 left-0 w-full h-full bg-black-alpha-50 z-999"
          onClick={() => setMobileVisible(false)}
        />
      )}

      <div className="content-wrapper">
        <header className="lg:hidden flex align-items-center p-3 surface-card shadow-2">
          <Button
            icon="pi pi-bars"
            className="p-button-text"
            onClick={() => setMobileVisible(true)}
          />
          <span className="font-bold text-xl ml-2">TechBizCEO</span>
        </header>

        <main className="main-content">
          {/* show floating timer on all pages except Parents */}
          {!isParentsPage && <FloatingTimer />}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
