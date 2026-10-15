
import "./Header.css";

function Header({
  activePage,
  sidebarOpen,
  setSidebarOpen,
  notifications,
  unreadCount,
  notificationsOpen,
  setNotificationsOpen,
  markAllAsRead,
  handleNotificationClick,
  setActivePage,
}) {
  return (
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
  );
}

export default Header;
