
import "./Dashboard.css";

const statistics = [
  {
    title: "Total Branches",
    value: "04",
    note: "Registered business branches",
    icon: "bi-buildings",
    color: "green",
  },
  {
    title: "Total Products",
    value: "1,248",
    note: "Products across all branches",
    icon: "bi-box-seam",
    color: "blue",
  },
  {
    title: "Today's Total Sales",
    value: "ETB 124,580",
    note: "Combined sales from all branches",
    icon: "bi-cash-stack",
    color: "purple",
  },
  {
    title: "Total Workers",
    value: "48",
    note: "Workers across all branches",
    icon: "bi-people",
    color: "orange",
  },
  {
    title: "Low Stock Items",
    value: "07",
    note: "Items requiring restocking",
    icon: "bi-exclamation-triangle",
    color: "red",
  },
];

const recentSales = [
  {
    id: "SL-1001",
    customer: "Abebe Kebede",
    product: "Cooking Oil",
    amount: "ETB 1,250",
    status: "Completed",
  },
  {
    id: "SL-1002",
    customer: "Sara Alemu",
    product: "Rice and Pasta",
    amount: "ETB 860",
    status: "Completed",
  },
  {
    id: "SL-1003",
    customer: "Walk-in Customer",
    product: "Milk Products",
    amount: "ETB 430",
    status: "Pending",
  },
  {
    id: "SL-1004",
    customer: "Dawit Tesfaye",
    product: "Cleaning Supplies",
    amount: "ETB 720",
    status: "Completed",
  },
];

const lowStockItems = [
  { name: "Cooking Oil", quantity: 4, unit: "bottles" },
  { name: "Sugar", quantity: 6, unit: "bags" },
  { name: "Laundry Soap", quantity: 3, unit: "packs" },
  { name: "Bottled Water", quantity: 8, unit: "bottles" },
];

function Dashboard() {
  return (
    <div className="dashboard-content">
      <section className="dashboard-welcome">
        <div>
          <span className="welcome-label">
            <i className="bi bi-sun me-2"></i>
            OWNER OVERVIEW
          </span>

          <h2>Welcome to FreshMart!</h2>

          <p>
            Manage your supermarket, track sales, monitor stock, and
            keep your business running smoothly.
          </p>
        </div>

        <div className="welcome-icon">
          <i className="bi bi-shop-window"></i>
        </div>
      </section>

      <div className="dashboard-section-heading">
        <div>
          <h4>Business Overview</h4>
          <p>Here is your supermarket's current summary.</p>
        </div>

        <span className="dashboard-status">
          <span></span>
          Owner dashboard
        </span>
      </div>

      <section className="statistics-grid">
        {statistics.map((item) => (
          <article className="stat-card" key={item.title}>
            <div className={`stat-icon ${item.color}`}>
              <i className={`bi ${item.icon}`}></i>
            </div>

            <p className="stat-title">{item.title}</p>
            <h3>{item.value}</h3>
            <span className="stat-note">{item.note}</span>
          </article>
        ))}
      </section>

      <section className="dashboard-panels">
        <div className="dashboard-panel sales-panel">
          <div className="panel-heading">
            <div>
              <h5>Recent Sales</h5>
              <p>Latest supermarket transactions</p>
            </div>

            <button
              type="button"
              className="panel-icon-button"
              aria-label="Sales options"
              title="Sales options"
            >
              <i className="bi bi-three-dots"></i>
            </button>
          </div>

          <div className="table-responsive">
            <table className="table dashboard-table align-middle">
              <thead>
                <tr>
                  <th>SALE ID</th>
                  <th>CUSTOMER</th>
                  <th>PRODUCT</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="sale-id">{sale.id}</td>
                    <td>{sale.customer}</td>
                    <td>{sale.product}</td>
                    <td className="sale-amount">{sale.amount}</td>
                    <td>
                      <span
                        className={`sale-status ${
                          sale.status === "Completed"
                            ? "completed"
                            : "pending"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-panel stock-panel">
          <div className="panel-heading">
            <div>
              <h5>Low Stock Alerts</h5>
              <p>Products that need attention</p>
            </div>

            <span className="stock-alert-count">
              {lowStockItems.length}
            </span>
          </div>

          <div className="stock-list">
            {lowStockItems.map((item) => (
              <div className="stock-item" key={item.name}>
                <div className="stock-item-icon">
                  <i className="bi bi-box-seam"></i>
                </div>

                <div className="stock-item-info">
                  <strong>{item.name}</strong>
                  <small>
                    Only {item.quantity} {item.unit} remaining
                  </small>
                </div>

                <i className="bi bi-exclamation-circle stock-warning"></i>
              </div>
            ))}
          </div>

          <button type="button" className="stock-view-button">
            Review inventory
            <i className="bi bi-arrow-right"></i>
          </button>
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>© 2026 FreshMart Management System</span>
        <span>Designed for efficient supermarket management</span>
      </footer>
    </div>
  );
}

export default Dashboard;
