
import { useState } from "react";
import "./Suppliers.css";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newSupplier = {
      id: Date.now(),
      ...formData,
      status: "Active",
    };

    setSuppliers((previous) => [...previous, newSupplier]);

    setFormData({
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    });

    setShowForm(false);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    `${supplier.companyName} ${supplier.contactPerson} ${supplier.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="suppliers-page">
      <div className="suppliers-heading">
        <div>
          <h2>Supplier Management</h2>
          <p>Manage your supermarket suppliers and their information.</p>
        </div>

        <button
          className="supplier-add-btn"
          onClick={() => setShowForm(!showForm)}
          type="button"
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Supplier
        </button>
      </div>

      <div className="supplier-summary">
        <div className="supplier-summary-card">
          <i className="bi bi-truck"></i>
          <div>
            <span>Total Suppliers</span>
            <h3>{suppliers.length}</h3>
          </div>
        </div>

        <div className="supplier-summary-card">
          <i className="bi bi-check-circle"></i>
          <div>
            <span>Active Suppliers</span>
            <h3>
              {suppliers.filter((supplier) => supplier.status === "Active").length}
            </h3>
          </div>
        </div>
      </div>

      {showForm && (
        <form className="supplier-form" onSubmit={handleSubmit}>
          <h3>Add New Supplier</h3>

          <div className="supplier-form-grid">
            <input
              name="companyName"
              placeholder="Company name"
              value={formData.companyName}
              onChange={handleChange}
              required
            />

            <input
              name="contactPerson"
              placeholder="Contact person"
              value={formData.contactPerson}
              onChange={handleChange}
              required
            />

            <input
              name="phone"
              type="tel"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              name="address"
              placeholder="Company address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="supplier-form-actions">
            <button
              type="button"
              className="supplier-cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

            <button type="submit" className="supplier-save-btn">
              Save Supplier
            </button>
          </div>
        </form>
      )}

      <div className="supplier-table-card">
        <div className="supplier-table-heading">
          <h3>All Suppliers</h3>

          <input
            type="search"
            placeholder="Search suppliers..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="table-responsive">
          <table className="table supplier-table align-middle">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.companyName}</td>
                    <td>{supplier.contactPerson}</td>
                    <td>{supplier.phone}</td>
                    <td>{supplier.email}</td>
                    <td>{supplier.address}</td>
                    <td>
                      <span className="supplier-status">
                        {supplier.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="supplier-empty">
                    No suppliers found. Click "Add Supplier" to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Suppliers;
