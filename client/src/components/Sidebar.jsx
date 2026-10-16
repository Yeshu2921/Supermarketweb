
import "./Sidebar.css";


const menuItems = [
  { name: "Dashboard", icon: "bi-grid-1x2-fill" },
  { name: "Branches", icon: "bi-buildings-fill" },
  { name: "User Management", icon: "bi-people-fill" },
  { name: "Products", icon: "bi-box-seam-fill" },
  { name: "Sales / POS", icon: "bi-cart-check-fill" },
  { name: "Suppliers", icon: "bi-truck" },
  { name: "Purchases", icon: "bi-bag-check-fill" },
  { name: "Inventory", icon: "bi-boxes" },
  { name: "Reports", icon: "bi-bar-chart-fill" },
  { name: "Settings", icon: "bi-gear-fill" },
];

function Sidebar({ activePage, setActivePage, open, setOpen }) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-overlay d-lg-none"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={`admin-sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <i className="bi bi-shop-window"></i>
          </div>

          <div className="brand-text">
            <h5>FreshMart</h5>
            <small>Supermarket System</small>
          </div>
        </div>

        <div className="sidebar-section-label">MAIN MENU</div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`sidebar-link ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(item.name);
                setOpen(false);
              }}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.name}</span>

              {item.name === "Messages" && (
                <span className="sidebar-menu-badge">3</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-owner">
            <div className="owner-avatar">
              <i className="bi bi-person-fill"></i>
            </div>

            <div className="sidebar-owner-info">
              <strong>Supermarket Owner</strong>
              <small>Administrator</small>
            </div>
          </div>

          <button
            type="button"
            className={`sidebar-link logout-link ${
              activePage === "Logout" ? "active" : ""
            }`}
            onClick={() => {
              setActivePage("Logout");
              setOpen(false);
            }}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
