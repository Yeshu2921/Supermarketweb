
import { useEffect, useState } from "react";
import "./Sidebar.css";

const menuItems = [
  { name: "Dashboard", icon: "bi-grid-1x2-fill" },
  { name: "Branches", icon: "bi-buildings-fill" },
  { name: "User Management", icon: "bi-people-fill" },

  {
    name: "Products",
    icon: "bi-box-seam-fill",
    children: [
      { name: "All Products", icon: "bi-box-seam" },
      { name: "Categories", icon: "bi-tags-fill" },
      { name: "Brands", icon: "bi-award-fill" },
    ],
  },

  { name: "Sales / POS", icon: "bi-cart-check-fill" },
  { name: "Suppliers", icon: "bi-truck" },
  { name: "Purchases", icon: "bi-bag-check-fill" },
  { name: "Inventory", icon: "bi-boxes" },
  { name: "Reports", icon: "bi-bar-chart-fill" },
  { name: "Settings", icon: "bi-gear-fill" },
];

function Sidebar({ activePage, setActivePage, open, setOpen }) {
  const [productsExpanded, setProductsExpanded] = useState(
    ["All Products", "Categories", "Brands"].includes(activePage)
  );

  // Automatically expand Products when a product submenu is active.
  useEffect(() => {
    if (["All Products", "Categories", "Brands"].includes(activePage)) {
      setProductsExpanded(true);
    }
  }, [activePage]);

  const handleNavigation = (pageName) => {
    setActivePage(pageName);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          className="sidebar-overlay d-lg-none"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`admin-sidebar ${open ? "sidebar-open" : ""}`}
      >
        {/* Brand */}
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

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isProductsMenu = item.name === "Products";
            const isChildActive = item.children?.some(
              (child) => child.name === activePage
            );

            if (isProductsMenu) {
              return (
                <div className="sidebar-menu-group" key={item.name}>
                  <button
                    type="button"
                    className={`sidebar-link ${
                      isChildActive || activePage === "Products"
                        ? "active"
                        : ""
                    } ${productsExpanded ? "menu-expanded" : ""}`}
                    onClick={() =>
                      setProductsExpanded((previous) => !previous)
                    }
                    aria-expanded={productsExpanded}
                    aria-controls="products-submenu"
                  >
                    <i className={`bi ${item.icon}`}></i>
                    <span className="sidebar-link-text">
                      {item.name}
                    </span>

                    <i
                      className={`bi bi-chevron-down submenu-arrow ${
                        productsExpanded ? "rotated" : ""
                      }`}
                    ></i>
                  </button>

                  {productsExpanded && (
                    <div
                      id="products-submenu"
                      className="sidebar-submenu"
                    >
                      {item.children.map((child) => (
                        <button
                          key={child.name}
                          type="button"
                          className={`sidebar-link sidebar-sublink ${
                            activePage === child.name ? "active" : ""
                          }`}
                          onClick={() => handleNavigation(child.name)}
                        >
                          <i className={`bi ${child.icon}`}></i>
                          <span>{child.name}</span>
                          {activePage === child.name && (
                            <span className="submenu-active-dot"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.name}
                type="button"
                className={`sidebar-link ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => handleNavigation(item.name)}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Owner information and logout */}
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
            onClick={() => handleNavigation("Logout")}
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
