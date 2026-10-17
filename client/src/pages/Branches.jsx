
import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import "./Branches.css";

function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
  });

  // Load branches
  async function loadBranches() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/branches");
      setBranches(data.branches || []);
    } catch (err) {
      setError(err.message || "Failed to load branches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  // Summary counts
  const totalBranches = branches.length;

  const activeBranches = branches.filter(
    (branch) => branch.status === "Active"
  ).length;

  const inactiveBranches = branches.filter(
    (branch) => branch.status !== "Active"
  ).length;

  // Search and filter
  const filteredBranches = branches.filter((branch) => {
    const query = search.toLowerCase();

    const matchesSearch =
      String(branch.branchNumber || "").toLowerCase().includes(query) ||
      String(branch.name || "").toLowerCase().includes(query) ||
      String(branch.location || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" || branch.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Open add form
  function openAddForm() {
    setEditingId(null);
    setFormData({ name: "", location: "" });
    setError("");
    setSuccessMessage("");
    setShowForm(true);
  }

  // Open edit form
  function openEditForm(branch) {
    setEditingId(branch.id);

    setFormData({
      name: branch.name || "",
      location: branch.location || "",
    });

    setError("");
    setSuccessMessage("");
    setShowForm(true);
  }

  // Close modal
  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", location: "" });
  }

  // Handle input changes
  function handleInputChange(e) {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Create or update branch
  async function handleSaveBranch(e) {
    e.preventDefault();

    const name = formData.name.trim();
    const location = formData.location.trim();

    if (!name || !location) {
      setError("Please enter the branch name and location.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const payload = { name, location };
      const isEditing = editingId !== null;

      if (isEditing) {
        await apiRequest(`/branches/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/branches", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      // Close modal after successful save
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", location: "" });

      // Show the correct success message
      setSuccessMessage(
        isEditing
          ? "Branch updated successfully!"
          : "Branch registered successfully!"
      );

      await loadBranches();
    } catch (err) {
      setError(err.message || "Failed to save branch.");
    } finally {
      setSaving(false);
    }
  }

  // Activate or deactivate branch
  async function toggleStatus(branch) {
    const nextStatus =
      branch.status === "Active" ? "Inactive" : "Active";

    try {
      setError("");
      setSuccessMessage("");

      await apiRequest(`/branches/${branch.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      setSuccessMessage(
        nextStatus === "Active"
          ? "Branch activated successfully!"
          : "Branch deactivated successfully!"
      );

      await loadBranches();
    } catch (err) {
      setError(err.message || "Failed to update branch status.");
    }
  }

  // Delete branch
  async function deleteBranch(id) {
    if (!window.confirm("Are you sure you want to delete this branch?")) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      await apiRequest(`/branches/${id}`, {
        method: "DELETE",
      });

      setSuccessMessage("Branch deleted successfully!");

      await loadBranches();
    } catch (err) {
      setError(err.message || "Failed to delete branch.");
    }
  }

  return (
    <div className="branches-page">
      {/* Page heading */}
      <div className="branches-heading">
        <div>
          <span className="branches-eyebrow">
            FRESHMART MANAGEMENT
          </span>
          <h2>Branches Management</h2>
          <p>Manage your supermarket branches and locations.</p>
        </div>

        <button
          type="button"
          className="add-branch-button"
          onClick={openAddForm}
        >
          <i className="fa-solid fa-plus" />
          Add Branch
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="branch-success-message" role="status">
          <i className="fa-solid fa-circle-check" />
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss success message"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="branch-form-error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            style={{
              float: "right",
              border: 0,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="branch-summary">
        <div className="branch-summary-card">
          <div className="branch-summary-icon summary-total">
            <i className="fa-solid fa-store" />
          </div>
          <div>
            <p>Total Branches</p>
            <h3>{loading ? "—" : totalBranches}</h3>
            <small>All registered branches</small>
          </div>
        </div>

        <div className="branch-summary-card">
          <div className="branch-summary-icon summary-active">
            <i className="fa-solid fa-circle-check" />
          </div>
          <div>
            <p>Active Branches</p>
            <h3>{loading ? "—" : activeBranches}</h3>
            <small>Currently active</small>
          </div>
        </div>

        <div className="branch-summary-card">
          <div className="branch-summary-icon summary-inactive">
            <i className="fa-solid fa-store-slash" />
          </div>
          <div>
            <p>Inactive / Closed</p>
            <h3>{loading ? "—" : inactiveBranches}</h3>
            <small>Inactive or temporarily closed</small>
          </div>
        </div>
      </div>

      {/* Branches table */}
      <div className="branches-table-panel">
        <div className="branches-toolbar">
          <div>
            <h4>All Branches</h4>
            <p>View and manage registered branches.</p>
          </div>

          <div className="branches-filters">
            <div className="branch-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="search"
                placeholder="Search branches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search branches"
              />
            </div>

            <select
              className="branch-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Temporarily Closed">
                Temporarily Closed
              </option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="branches-table">
            <thead>
              <tr>
                <th>BRANCH NO.</th>
                <th>BRANCH NAME</th>
                <th>LOCATION</th>
                <th>CREATED DATE</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="branches-empty">
                    <i className="fa-solid fa-spinner fa-spin" />
                    <h5>Loading branches...</h5>
                    <p>Please wait while data is loaded.</p>
                  </td>
                </tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="branches-empty">
                    <i className="fa-solid fa-store" />
                    <h5>No branches found</h5>
                    <p>
                      {branches.length === 0
                        ? "Add your first branch to get started."
                        : "Try changing your search or status filter."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => {
                  const branchNumber =
                    branch.branchNumber ||
                    `BR-${String(branch.id).padStart(4, "0")}`;

                  const statusClass =
                    branch.status === "Active"
                      ? "status-active"
                      : "status-inactive";

                  const isActive = branch.status === "Active";

                  return (
                    <tr key={branch.id}>
                      <td>
                        <span className="branch-number">
                          {branchNumber}
                        </span>
                      </td>

                      <td>
                        <div className="branch-name-cell">
                          <div className="branch-table-icon">
                            <i className="fa-solid fa-store" />
                          </div>
                          <strong title={branch.name}>
                            {branch.name}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <span className="branch-location">
                          <i className="fa-solid fa-location-dot" />{" "}
                          {branch.location || "Not specified"}
                        </span>
                      </td>

                      <td className="branch-date">
                        {branch.createdAt || "—"}
                      </td>

                      <td>
                        <span
                          className={`branch-status ${statusClass}`}
                        >
                          <span />
                          {branch.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="branch-actions">
                          {/* Edit */}
                          <button
                            type="button"
                            className="branch-action-btn edit-btn"
                            title="Edit branch"
                            aria-label="Edit branch"
                            onClick={() => openEditForm(branch)}
                          >
                            <i className="fa-solid fa-pen-to-square" />
                            <span>Edit</span>
                          </button>

                          {/* Activate / Deactivate */}
                          <button
                            type="button"
                            className={`branch-action-btn ${
                              isActive
                                ? "status-active-btn"
                                : "status-inactive-btn"
                            }`}
                            title={
                              isActive
                                ? "Deactivate branch"
                                : "Activate branch"
                            }
                            aria-label={
                              isActive
                                ? "Deactivate branch"
                                : "Activate branch"
                            }
                            onClick={() => toggleStatus(branch)}
                          >
                            <i
                              className={`fa-solid ${
                                isActive
                                  ? "fa-toggle-on"
                                  : "fa-toggle-off"
                              }`}
                            />
                            <span>
                              {isActive ? "Deact" : "Activ"}
                            </span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            className="branch-action-btn delete-btn"
                            title="Delete branch"
                            aria-label="Delete branch"
                            onClick={() => deleteBranch(branch.id)}
                          >
                            <i className="fa-solid fa-trash" />
                            <span>Del</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="branches-table-footer">
          <span>
            Showing {loading ? 0 : filteredBranches.length} of{" "}
            {branches.length} branches
          </span>
          <span>FreshMart Branch Management</span>
        </div>
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div
          className="branch-modal-backdrop"
          onClick={closeForm}
        >
          <div
            className="branch-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="branch-modal-header">
              <div className="branch-modal-heading-icon">
                <i className="fa-solid fa-store" />
              </div>

              <div>
                <h4 id="branch-modal-title">
                  {editingId !== null
                    ? "Edit Branch"
                    : "Add New Branch"}
                </h4>
                <p>
                  {editingId !== null
                    ? "Update this branch's information."
                    : "Enter the details of your new branch."}
                </p>
              </div>

              <button
                type="button"
                className="branch-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close modal"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch}>
              <div className="branch-modal-body">
                {editingId !== null && (
                  <div className="branch-number-preview">
                    <label>Branch Number</label>
                    <strong>
                      {branches.find(
                        (branch) => branch.id === editingId
                      )?.branchNumber ||
                        `BR-${String(editingId).padStart(4, "0")}`}
                    </strong>
                    <small>Branch number cannot be changed.</small>
                  </div>
                )}

                <div className="branch-form-field">
                  <label htmlFor="branch-name">Branch Name *</label>
                  <input
                    id="branch-name"
                    type="text"
                    name="name"
                    placeholder="e.g. Bahir Dar Branch"
                    value={formData.name}
                    onChange={handleInputChange}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="branch-form-field">
                  <label htmlFor="branch-location">Location *</label>
                  <input
                    id="branch-location"
                    type="text"
                    name="location"
                    placeholder="e.g. Bahir Dar, Ethiopia"
                    value={formData.location}
                    onChange={handleInputChange}
                    maxLength={255}
                    required
                  />
                </div>
              </div>

              <div className="branch-modal-footer">
                <button
                  type="button"
                  className="branch-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="branch-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Branch"
                    : "Save Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Branches;
