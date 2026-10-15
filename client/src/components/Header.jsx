
import { useEffect, useRef, useState } from "react";
import "./Header.css";

function Header({
  activePage,
  sidebarOpen,
  setSidebarOpen,
  notifications = [],
  unreadCount = 0,
  notificationsOpen,
  setNotificationsOpen,
  markAllAsRead,
  handleNotificationClick,
  setActivePage,
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  // Close dropdowns when the user clicks outside them.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [setNotificationsOpen]);

  // Open an account page in the dashboard content.
  const openAccountPage = (page) => {
    setProfileOpen(false);
    setNotificationsOpen(false);
    setActivePage(page);
  };

  // Keep the profile and notification menus from opening together.
  const toggleProfile = () => {
    setNotificationsOpen(false);
    setProfileOpen((previous) => !previous);
  };

  const toggleNotifications = () => {
    setProfileOpen(false);
    setNotificationsOpen((previous) => !previous);
  };

  return (
    <header className="admin-topbar">
      {/* Left: mobile menu and current page */}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
        aria-expanded={sidebarOpen}
      >
        <i className="bi bi-list" aria-hidden="true" />
      </button>

      <div className="topbar-heading">
        <h5>{activePage}</h5>

        <p>
          <span>FreshMart</span>
          <i className="bi bi-chevron-right mx-2" aria-hidden="true" />
          {activePage}
        </p>
      </div>

      {/* Right: notifications and owner profile */}
      <div className="topbar-actions">
        {/* Notifications dropdown */}
        <div className="notification-wrapper" ref={notificationRef}>
          <button
            type="button"
            className="notification-button"
            onClick={toggleNotifications}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <i className="bi bi-bell" aria-hidden="true" />

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div>
                  <h6>Notifications</h6>
                  <p>
                    You have {unreadCount} unread{" "}
                    {unreadCount === 1 ? "notification" : "notifications"}
                  </p>
                </div>

                <button
                  type="button"
                  className="mark-read-button"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </button>
              </div>

              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      className={`notification-item ${
                        !notification.read ? "unread" : ""
                      }`}
                      onClick={() => {
                        handleNotificationClick(notification.id);
                        setNotificationsOpen(false);

                        if (notification.title === "Low stock alert") {
                          setActivePage("Inventory");
                        } else if (
                          notification.title === "Supplier request"
                        ) {
                          setActivePage("Suppliers");
                        } else if (
                          notification.title === "New customer message"
                        ) {
                          setActivePage("Messages");
                        }
                      }}
                    >
                      <span
                        className={`notification-icon ${
                          notification.type || "info"
                        }`}
                      >
                        <i
                          className={`bi ${
                            notification.icon || "bi-bell"
                          }`}
                          aria-hidden="true"
                        />
                      </span>

                      <span className="notification-content">
                        <h6>{notification.title}</h6>
                        <p>{notification.message}</p>
                        <small>{notification.time}</small>
                      </span>

                      {!notification.read && (
                        <span className="unread-dot" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="empty-notifications">
                    <i
                      className="bi bi-check-circle"
                      aria-hidden="true"
                    />
                    <p>You are all caught up!</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="notification-footer"
                onClick={() => openAccountPage("Reports")}
              >
                View all alerts
                <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="topbar-divider" />

        {/* Owner profile dropdown */}
        <div className="owner-profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className={`owner-profile-trigger ${
              profileOpen ? "profile-active" : ""
            }`}
            onClick={toggleProfile}
            aria-label="Open owner profile menu"
            aria-expanded={profileOpen}
          >
            <span className="owner-topbar-avatar">
              <i className="bi bi-person-fill" aria-hidden="true" />
            </span>

            <span className="owner-topbar-text">
              <strong>Supermarket Owner</strong>
              <small>Administrator</small>
            </span>

            <i
              className={`bi ${
                profileOpen ? "bi-chevron-up" : "bi-chevron-down"
              } owner-profile-chevron`}
              aria-hidden="true"
            />
          </button>

          {profileOpen && (
            <div className="owner-profile-dropdown">
              {/* Profile heading */}
              <div className="profile-dropdown-heading">
                <div className="profile-dropdown-avatar">
                  <i className="bi bi-person-fill" aria-hidden="true" />
                </div>

                <div className="profile-dropdown-identity">
                  <strong>Supermarket Owner</strong>
                  <span>owner@freshmart.com</span>
                  <small>
                    <i
                      className="bi bi-shield-check me-1"
                      aria-hidden="true"
                    />
                    Administrator
                  </small>
                </div>
              </div>

              {/* Account options */}
              <div className="profile-menu-section">
                <p className="profile-menu-label">ACCOUNT</p>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => openAccountPage("My Profile")}
                >
                  <span className="profile-menu-icon green">
                    <i className="bi bi-person" aria-hidden="true" />
                  </span>
                  <span className="profile-menu-text">
                    <strong>My Profile</strong>
                    <small>Manage your personal information</small>
                  </span>
                  <i
                    className="bi bi-chevron-right profile-menu-arrow"
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => openAccountPage("Change Profile Picture")}
                >
                  <span className="profile-menu-icon blue">
                    <i className="bi bi-camera" aria-hidden="true" />
                  </span>
                  <span className="profile-menu-text">
                    <strong>Profile Picture</strong>
                    <small>Change your profile photo</small>
                  </span>
                  <i
                    className="bi bi-chevron-right profile-menu-arrow"
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => openAccountPage("Change Password")}
                >
                  <span className="profile-menu-icon orange">
                    <i
                      className="bi bi-lock"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="profile-menu-text">
                    <strong>Change Password</strong>
                    <small>Update your account password</small>
                  </span>
                  <i
                    className="bi bi-chevron-right profile-menu-arrow"
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={() => openAccountPage("Security & Settings")}
                >
                  <span className="profile-menu-icon purple">
                    <i
                      className="bi bi-shield-lock"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="profile-menu-text">
                    <strong>Security & Settings</strong>
                    <small>Account preferences and security</small>
                  </span>
                  <i
                    className="bi bi-chevron-right profile-menu-arrow"
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Logout */}
              <div className="profile-menu-footer">
                <button
                  type="button"
                  className="profile-logout-button"
                  onClick={() => openAccountPage("Logout")}
                >
                  <i
                    className="bi bi-box-arrow-right"
                    aria-hidden="true"
                  />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
