
import { useState } from "react";
import "./Branches.css";

const initialBranches = [
  {
    id: 1,
    branchNumber: "BR-0001",
    name: "Bahir Dar Main Branch",
    location: "Bahir Dar, Amhara",
    status: "Active",
    createdAt: "2026-01-15",
  },
  {
    id: 2,
    branchNumber: "BR-0002",
    name: "Addis Ababa Branch",
    location: "Bole, Addis Ababa",
    status: "Active",
    createdAt: "2026-02-10",
  },
  {
    id: 3,
    branchNumber: "BR-0003",
    name: "Gondar Branch",
    location: "Gondar, Amhara",
    status: "Inactive",
    createdAt: "2026-03-05",
  },
  {
    id: 4,
    branchNumber: "BR-0004",
    name: "Hawassa Branch",
    location: "Hawassa, Sidama",
    status: "Active",
    createdAt: "2026-04-20",
  },
];

const emptyForm = {
  name: "",
  location: "",
};

function Branches() {
  const [branches, setBranches] = useState(initialBranches);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");

  const activeCount = branches.filter(
    (branch) => branch.status === "Active"
  ).length;

  const inactiveCount = branches.length - activeCount;

  const filteredBranches = branches.filter((branch) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      branch.branchNumber.toLowerCase().includes(searchText) ||
      branch.name.toLowerCase().includes(searchText) ||
      branch.location.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || branch.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function openAddForm() {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
    setShowForm(true);
  }

  function openEditForm(branch) {
    setEditingId(branch.id);
    setFormData({
      name: branch.name,
      location: branch.location,
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const name = formData.name.trim();
    const location = formData.location.trim();

    if (!name || !location) {
      setError("Please enter both the branch name and location.");
      return;
    }

    const duplicateName = branches.some(
      (branch) =>
        branch.name.toLowerCase() === name.toLowerCase() &&
        branch.id !== editingId
    );

    if (duplicateName) {
      setError("A branch with this name already exists.");
      return;
    }

    if (editingId !== null) {
      setBranches((previous) =>
        previous.map((branch) =>
          branch.id === editingId
            ? { ...branch, name, location }
            : branch
        )
      );
    } else {
      const nextId =
        branches.length === 0
          ? 1
          : Math.max(...branches.map((branch) => branch.id)) + 1;

      const nextNumber =
        branches.length === 0
          ? 1
          : Math.max(
              ...branches.map(
                (branch) =>
                  Number(branch.branchNumber.replace("BR-", "")) || 0
              )
            ) + 1;

      const newBranch = {
        id: nextId,
        branchNumber: `BR-${String(nextNumber).padStart(4, "0")}`,
        name,
        location,
        status: "Active",
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setBranches((previous) => [...previous, newBranch]);
    }

    closeForm();
  }

  function toggleBranchStatus(branchId) {
    setBranches((previous) =>
      previous.map((branch) =>
        branch.id === branchId
          ? {
              ...branch,
              status:
                branch.status === "Active" ? "Inactive" : "Active",
            }
          : branch
      )
    );
  }

  function deleteBranch(branch) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${branch.name} (${branch.branchNumber})?`
    );

    if (confirmed) {
      setBranches((previous) =>
        previous.filter((item) => item.id !== branch.id)
      );
    }
  }

  return (
    <div className="branches-page">
      {/* Page heading */}
      <section className="branches-heading">
        <div>
          <span className="branches-eyebrow">
            <i className="bi bi-buildings me-2"></i>
            BUSINESS MANAGEMENT
          </span>

          <h2>Branches Management</h2>

          <p>
            Create, update, and control all branches across your
            supermarket business.
          </p>
        </div>

        <button
          type="button"
          className="add-branch-button"
          onClick={openAddForm}
        >
          <i className="bi bi-plus-lg"></i>
          Add New Branch
        </button>
      </section>

      {/* Summary cards */}
      <section className="branch-summary">
        <article className="branch-summary-card">
          <div className="branch-summary-icon summary-total">
            <i className="bi bi-buildings"></i>
          </div>
          <div>
            <p>Total Branches</p>
            <h3>{branches.length}</h3>
            <small>All registered branches</small>
          </div>
        </article>

        <article className="branch-summary-card">
          <div className="branch-summary-icon summary-active">
            <i className="bi bi-check-circle"></i>
          </div>
          <div>
            <p>Active Branches</p>
            <h3>{activeCount}</h3>
            <small>Currently operational</small>
          </div>
        </article>

        <article className="branch-summary-card">
          <div className="branch-summary-icon summary-inactive">
            <i className="bi bi-pause-circle"></i>
          </div>
          <div>
            <p>Inactive Branches</p>
            <h3>{inactiveCount}</h3>
            <small>Temporarily disabled</small>
          </div>
        </article>
      </section>

      {/* Branches table */}
      <section className="branches-table-panel">
        <div className="branches-toolbar">
          <div>
            <h4>All Branches</h4>
            <p>Manage branch information and operating status.</p>
          </div>

          <div className="branches-filters">
            <div className="branch-search">
              <i className="bi bi-search"></i>
              <input
                type="search"
                placeholder="Search branches..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search branches"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by branch status"
              className="branch-status-filter"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table branches-table align-middle">
            <thead>
              <tr>
                <th>BRANCH</th>
                <th>BRANCH NUMBER</th>
                <th>LOCATION</th>
                <th>CREATED</th>
                <th>STATUS</th>
                <th className="text-end">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredBranches.map((branch) => (
                <tr key={branch.id}>
                  <td>
                    <div className="branch-name-cell">
                      <div className="branch-table-icon">
                        <i className="bi bi-shop"></i>
                      </div>
                      <strong>{branch.name}</strong>
                    </div>
                  </td>

                  <td>
                    <span className="branch-number">
                      {branch.branchNumber}
                    </span>
                  </td>

                  <td>
                    <span className="branch-location">
                      <i className="bi bi-geo-alt me-1"></i>
                      {branch.location}
                    </span>
                  </td>

                  <td className="branch-date">{branch.createdAt}</td>

                  <td>
                    <span
                      className={`branch-status ${
                        branch.status === "Active"
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      <span></span>
                      {branch.status}
                    </span>
                  </td>

                  {/* Action icons */}
                  <td>
                    <div className="branch-actions">
                      <button
                        type="button"
                        className="branch-action-btn edit-btn"
                        onClick={() => openEditForm(branch)}
                        title="Edit branch"
                        aria-label="Edit branch"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>

                      <button
                        type="button"
                        className={`branch-action-btn ${
                          branch.status === "Active"
                            ? "status-active-btn"
                            : "status-inactive-btn"
                        }`}
                        onClick={() => toggleBranchStatus(branch.id)}
                        title={
                          branch.status === "Active"
                            ? "Deactivate branch"
                            : "Activate branch"
                        }
                        aria-label={
                          branch.status === "Active"
                            ? "Deactivate branch"
                            : "Activate branch"
                        }
                      >
                        <i
                          className={`bi ${
                            branch.status === "Active"
                              ? "bi-toggle-on"
                              : "bi-toggle-off"
                          }`}
                        ></i>
                      </button>

                      <button
                        type="button"
                        className="branch-action-btn delete-btn"
                        onClick={() => deleteBranch(branch)}
                        title="Delete branch"
                        aria-label="Delete branch"
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBranches.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <div className="branches-empty">
                      <i className="bi bi-search"></i>
                      <h5>No branches found</h5>
                      <p>Try another search or add a new branch.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="branches-table-footer">
          <span>
            Showing {filteredBranches.length} of {branches.length} branches
          </span>
          <span>
            <i className="bi bi-shield-check me-1"></i>
            Owner management
          </span>
        </div>
      </section>

      {/* Add/Edit branch modal */}
      {showForm && (
        <div
          className="branch-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <section
            className="branch-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-modal-title"
          >
            <div className="branch-modal-header">
              <div className="branch-modal-heading-icon">
                <i
                  className={`bi ${
                    editingId !== null
                      ? "bi-pencil-square"
                      : "bi-building-add"
                  }`}
                ></i>
              </div>

              <div>
                <h4 id="branch-modal-title">
                  {editingId !== null ? "Edit Branch" : "Add New Branch"}
                </h4>
                <p>
                  {editingId !== null
                    ? "Update the branch information below."
                    : "Enter the information for your new branch."}
                </p>
              </div>

              <button
                type="button"
                className="branch-modal-close"
                onClick={closeForm}
                aria-label="Close form"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="branch-modal-body">
                {editingId !== null && (
                  <div className="branch-number-preview">
                    <label>Branch Number</label>
                    <strong>
                      {
                        branches.find(
                          (branch) => branch.id === editingId
                        )?.branchNumber
                      }
                    </strong>
                    <small>
                      Unique branch number cannot be edited.
                    </small>
                  </div>
                )}

                <div className="branch-form-field">
                  <label htmlFor="branchName">Branch Name *</label>
                  <input
                    id="branchName"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Bahir Dar Main Branch"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="branch-form-field">
                  <label htmlFor="branchLocation">
                    Branch Location *
                  </label>
                  <input
                    id="branchLocation"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Bahir Dar, Amhara"
                    maxLength={200}
                    required
                  />
                </div>

                {error && (
                  <div className="branch-form-error" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                  </div>
                )}
              </div>

              <div className="branch-modal-footer">
                <button
                  type="button"
                  className="branch-cancel-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button type="submit" className="branch-save-button">
                  <i className="bi bi-check2-circle me-2"></i>
                  {editingId !== null
                    ? "Save Changes"
                    : "Create Branch"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Branches;
