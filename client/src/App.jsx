
import { useState } from "react";

import OwnerLogin from "./pages/OwnerLogin";
import Dashboard from "./pages/Dashboard";
import Branches from "./pages/Branches";
import Sidebar from "./components/Sidebar";

import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New customer message",
      message: "A customer sent a message about product availability.",
      time: "2 minutes ago",
      type: "message",
      unread: true,
    },
    {
      id: 2,
      title: "Low stock alert",
      message: "Cooking oil is running low in Bahir Dar Branch.",
      time: "15 minutes ago",
      type: "stock",
      unread: true,
    },
    {
      id: 3,
      title: "New supplier request",
      message: "A supplier request needs your attention.",
      time: "1 hour ago",
      type: "supplier",
      unread: true,
    },
  ]);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  function markAllAsRead() {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  }

  function handleNotificationClick(notificationId) {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? { ...notification, unread: false }
          : notification
      )
    );
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setActivePage("Dashboard");
    setSidebarOpen(false);
    setNotificationsOpen(false);
  }

  // Display the owner login before entering the dashboard.
  if (!isLoggedIn) {
    return <OwnerLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      {/* Main application content */}
      <main className="admin-main">
        {/* Top navigation bar */}
        <header className="admin-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setSidebarOpen((previous) => !previous)}
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
          >
            <i className="bi bi-list"></i>
          </button>

          <div className="topbar-heading">
            <h5>{activePage}</h5>
            <p>FreshMart / {activePage}</p>
          </div>

          <div className="topbar-actions">
            {/* Notifications */}
            <div className="notification-wrapper">
              <button
                type="button"
                className="notification-button"
                onClick={() =>
                  setNotificationsOpen((previous) => !previous)
                }
                aria-label="Show notifications"
                aria-expanded={notificationsOpen}
              >
                <i className="bi bi-bell"></i>

                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <div>
                      <h6>Notifications</h6>
                      <small>
                        {unreadCount} unread notification
                        {unreadCount !== 1 ? "s" : ""}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="mark-read-button"
                      onClick={markAllAsRead}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <p className="empty-notifications">
                        You have no notifications.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          className={`notification-item ${
                            notification.unread ? "unread" : ""
                          }`}
                          onClick={() =>
                            handleNotificationClick(notification.id)
                          }
                        >
                          <span className="notification-icon">
                            <i
                              className={`bi ${
                                notification.type === "message"
                                  ? "bi-chat-dots"
                                  : notification.type === "stock"
                                  ? "bi-exclamation-triangle"
                                  : "bi-truck"
                              }`}
                            ></i>
                          </span>

                          <span className="notification-content">
                            <strong>{notification.title}</strong>
                            <span>{notification.message}</span>
                            <small>{notification.time}</small>
                          </span>

                          {notification.unread && (
                            <span className="unread-dot"></span>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    className="notification-footer"
                    onClick={() => {
                      markAllAsRead();
                      setNotificationsOpen(false);
                      setActivePage("Reports");
                    }}
                  >
                    View all alerts
                    <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              )}
            </div>

            <div className="topbar-divider"></div>

            {/* Owner profile */}
            <div className="owner-topbar-profile">
              <div className="owner-topbar-avatar">
                <i className="bi bi-person-fill"></i>
              </div>

              <div className="owner-topbar-text">
                <strong>Owner</strong>
                <small>Administrator</small>
              </div>
            </div>
          </div>
        </header>

        {/* Page routing */}
        {activePage === "Dashboard" ? (
          <Dashboard />
        ) : activePage === "Branches" ? (
          <Branches />
        ) : activePage === "Logout" ? (
          <section className="page-placeholder">
            <i className="bi bi-box-arrow-right"></i>

            <h3>Logout</h3>

            <p>
              Are you sure you want to leave the owner dashboard?
            </p>

            <button
              type="button"
              className="btn btn-danger me-2"
              onClick={handleLogout}
            >
              Yes, Logout
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setActivePage("Dashboard")}
            >
              Cancel
            </button>
          </section>
        ) : (
          <section className="page-placeholder">
            <i className="bi bi-grid"></i>

            <h3>{activePage}</h3>

            <p>
              The {activePage} management page will be developed next.
            </p>

            <button
              type="button"
              className="btn btn-success"
              onClick={() => setActivePage("Dashboard")}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
