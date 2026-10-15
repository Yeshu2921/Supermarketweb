
import { useState } from "react";

import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MyProfile from "./pages/MyProfile";
import OwnerLogin from "./pages/OwnerLogin";
import Dashboard from "./pages/Dashboard";
import Branches from "./pages/Branches";

function App() {
  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Current page
  const [activePage, setActivePage] = useState("Dashboard");

  // Sidebar state for mobile screens
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notification dropdown state
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Demo notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New customer message",
      message: "A customer has sent a new message.",
      time: "5 minutes ago",
      type: "info",
      icon: "bi-chat-left-text",
      read: false,
    },
    {
      id: 2,
      title: "Low stock alert",
      message: "Some products are running low in stock.",
      time: "20 minutes ago",
      type: "warning",
      icon: "bi-exclamation-triangle",
      read: false,
    },
    {
      id: 3,
      title: "Supplier request",
      message: "A supplier request needs your attention.",
      time: "1 hour ago",
      type: "info",
      icon: "bi-truck",
      read: true,
    },
  ]);

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // Mark every notification as read
  const markAllAsRead = () => {
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  // Mark one notification as read when clicked
  const handleNotificationClick = (id) => {
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Open a page and close mobile menus
  const handlePageChange = (page) => {
    if (page === "Logout") {
      setActivePage("Logout");
    } else {
      setActivePage(page);
    }

    setSidebarOpen(false);
    setNotificationsOpen(false);
  };

  // Logout from the owner dashboard
  const handleLogout = () => {
    setIsLoggedIn(false);
    setActivePage("Dashboard");
    setSidebarOpen(false);
    setNotificationsOpen(false);
  };

  // Show login page before the dashboard
  if (!isLoggedIn) {
    return (
      <OwnerLogin
        onLogin={() => {
          setIsLoggedIn(true);
          setActivePage("Dashboard");
        }}
      />
    );
  }

  // Select the page displayed in the center
  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "My Profile":
        return <MyProfile />;
      case "Branches":
        return <Branches />;

      case "Logout":
        return (
          <section className="logout-confirmation">
            <div className="page-placeholder">
              <i className="bi bi-box-arrow-right" aria-hidden="true" />

              <h3>Logout from FreshMart?</h3>

              <p>
                Are you sure you want to leave the owner dashboard?
                You will need to log in again to access it.
              </p>

              <div className="d-flex justify-content-center flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handlePageChange("Dashboard")}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleLogout}
                >
                  <i
                    className="bi bi-box-arrow-right me-2"
                    aria-hidden="true"
                  />
                  Yes, Logout
                </button>
              </div>
            </div>
          </section>
        );

      default:
        return (
          <section className="page-placeholder">
            <i className="bi bi-tools" aria-hidden="true" />

            <h3>{activePage}</h3>

            <p>
              The {activePage} page is not implemented yet.
              You can add its functionality here.
            </p>
          </section>
        );
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar stays common across dashboard pages */}
      <Sidebar
        activePage={activePage}
        setActivePage={handlePageChange}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="admin-main">
        {/* Header stays common across dashboard pages */}
        <Header
          activePage={activePage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          notifications={notifications}
          unreadCount={unreadCount}
          notificationsOpen={notificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          markAllAsRead={markAllAsRead}
          handleNotificationClick={handleNotificationClick}
          setActivePage={handlePageChange}
        />

        {/* Only this central content changes */}
        <main className="admin-content">
          {renderPage()}
        </main>

        {/* Footer stays common across dashboard pages */}
        <Footer />
      </div>
    </div>
  );
}

export default App;
