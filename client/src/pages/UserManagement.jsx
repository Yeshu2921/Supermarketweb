
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api";
import "./UserManagement.css";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  role: "worker",
  password: "",
};

function normalizeUser(user) {
  return {
    id: user.id,
    name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    role: user.role || "worker",
    status: user.is_active ? "Active" : "Inactive",
  };
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("/users");
      const list = Array.isArray(result) ? result : result.users;

      if (!Array.isArray(list)) {
        throw new Error("The server returned an unexpected user list.");
      }

      setUsers(list.map(normalizeUser));
    } catch (err) {
      setError(err.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch = [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.address,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      const matchesRole =
        roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        user.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "Active").length,
      suppliers: users.filter((u) => u.role === "supplier").length,
      workers: users.filter((u) => u.role === "worker").length,
    }),
    [users]
  );

  function openAddForm() {
    setEditingUserId(null);
    setFormData({ ...emptyForm });
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function openEditForm(user) {
    if (user.role === "owner") return;

    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      password: "",
    });

    setMessage("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingUserId(null);
    setFormData({ ...emptyForm });
    setMessage("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function getNameParts(fullName) {
    const parts = fullName.trim().split(/\s+/);

    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const fullName = formData.name.trim();
    const nameParts = getNameParts(fullName);

    if (!nameParts.firstName || !nameParts.lastName) {
      setError("Enter both a first name and a last name.");
      return;
    }

    if (formData.phone.trim().length < 9) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (
      editingUserId === null &&
      (formData.password.length < 8 || formData.password.length > 72)
    ) {
      setError("The default password must contain 8–72 characters.");
      return;
    }

    const payload = {
      ...nameParts,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      role: formData.role,
    };

    if (editingUserId === null) {
      payload.password = formData.password;
    }

    setSaving(true);

    try {
      if (editingUserId !== null) {
        await apiRequest(`/users/${editingUserId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setMessage("User information updated successfully.");
      } else {
        await apiRequest("/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setMessage("User account created successfully.");
      }

      setShowForm(false);
      setEditingUserId(null);
      setFormData({ ...emptyForm });

      await loadUsers();
    } catch (err) {
      setError(err.message || "Could not save the user.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user) {
    if (user.role === "owner") return;

    const nextActive = user.status !== "Active";

    try {
      setError("");
      await apiRequest(`/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextActive }),
      });

      await loadUsers();
    } catch (err) {
      setError(err.message || "Could not change account status.");
    }
  }

  
async function handleDelete(user) {
  if (user.role === "owner") return;

  const confirmed = window.confirm(
    `Delete ${user.name}'s account? They will no longer be able to log in.`
  );

  if (!confirmed) return;

  setError("");
  setMessage("");

  try {
    const result = await apiRequest(`/users/${user.id}`, {
      method: "DELETE",
    });

    setUsers((previous) =>
      previous.filter((item) => item.id !== user.id)
    );

    setMessage(
      result.message || `${user.name}'s account deleted successfully.`
    );
  } catch (err) {
    setError(err.message || "Could not delete this account.");
  }
}

  async function handleResetPassword(user) {
    if (user.role === "owner") return;

    const password = window.prompt(
      `Enter a new default password for ${user.name} (at least 8 characters):`
    );

    if (password === null) return;

    if (password.length < 8 || password.length > 72) {
      setError("The password must contain 8–72 characters.");
      return;
    }

    const confirmed = window.confirm(
      `Set the new password for ${user.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await apiRequest(`/users/${user.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      setMessage(`Password reset successfully for ${user.name}.`);
    } catch (err) {
      setError(err.message || "Could not reset the password.");
    }
  }

  return (
    <div className="user-management">
      <div className="um-heading">
        <div>
          <span className="um-eyebrow">ADMINISTRATION</span>
          <h2>User Management</h2>
          <p>Manage team accounts, contact details, and access.</p>
        </div>

        <div className="um-heading-icon">
          <i className="bi bi-people-fill"></i>
        </div>
      </div>

      {error && (
        <div className="um-form-error" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="status">
          {message}
          <button
            type="button"
            className="btn-close float-end"
            aria-label="Dismiss"
            onClick={() => setMessage("")}
          />
        </div>
      )}

      <div className="um-stats">
        <article className="um-stat-card">
          <div className="um-stat-icon blue">
            <i className="bi bi-people"></i>
          </div>
          <div>
            <span>Total Users</span>
            <h3>{counts.total}</h3>
            <small>Registered accounts</small>
          </div>
        </article>

        <article className="um-stat-card">
          <div className="um-stat-icon green">
            <i className="bi bi-person-check"></i>
          </div>
          <div>
            <span>Active Users</span>
            <h3>{counts.active}</h3>
            <small>Enabled accounts</small>
          </div>
        </article>

        <article className="um-stat-card">
          <div className="um-stat-icon purple">
            <i className="bi bi-truck"></i>
          </div>
          <div>
            <span>Suppliers</span>
            <h3>{counts.suppliers}</h3>
            <small>Supplier accounts</small>
          </div>
        </article>

        <article className="um-stat-card">
          <div className="um-stat-icon orange">
            <i className="bi bi-person-badge"></i>
          </div>
          <div>
            <span>Workers</span>
            <h3>{counts.workers}</h3>
            <small>Worker accounts</small>
          </div>
        </article>
      </div>

      <section className="um-table-card">
        <div className="um-table-title">
          <div>
            <h3>All Accounts</h3>
            <p>
              Showing {filteredUsers.length} of {counts.total} users
            </p>
          </div>

          <button
            type="button"
            className="um-refresh-btn"
            onClick={loadUsers}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
        </div>

        <div className="um-filters">
          <div className="um-search">
            <i className="bi bi-search"></i>
            <input
              type="search"
              aria-label="Search users"
              placeholder="Search name, ID, email, phone, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="worker">Worker</option>
            <option value="supplier">Supplier</option>
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="um-add-user-row">
          <div>
            <strong>Manage your team</strong>
            <span>Create accounts and set their initial passwords.</span>
          </div>

          <button
            type="button"
            className="um-add-user-btn"
            onClick={openAddForm}
          >
            <i className="bi bi-person-plus-fill"></i>
            Add User
          </button>
        </div>

        {showForm && (
          <form className="um-user-form" onSubmit={handleSubmit}>
            <div className="um-form-heading">
              <div>
                <h3>
                  {editingUserId !== null
                    ? "Edit User"
                    : "Create User Account"}
                </h3>
                <p>
                  {editingUserId !== null
                    ? "Update the account details."
                    : "Enter the new team member's information."}
                </p>
              </div>

              <button
                type="button"
                className="um-close-form"
                onClick={closeForm}
                aria-label="Close form"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {message && (
              <div className="um-form-error" role="alert">
                {message}
              </div>
            )}

            <div className="um-form-grid">
              <label>
                Full name
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="First and last name"
                  autoComplete="name"
                  required
                  maxLength={150}
                />
              </label>

              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  maxLength={190}
                />
              </label>

              <label>
                Phone number
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  required
                  maxLength={30}
                />
              </label>

              <label>
                Address
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Enter residential or business address"
                  autoComplete="street-address"
                  maxLength={255}
                />
              </label>

              <label>
                Account role
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="worker">Worker</option>
                  <option value="supplier">Supplier</option>
                </select>
              </label>

              {editingUserId === null && (
                <label>
                  Default password
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </label>
              )}
            </div>

            {editingUserId === null && (
              <p className="um-password-note">
                <i className="bi bi-shield-lock me-2"></i>
                The backend hashes the default password before storing it.
                Give the password securely to the new account holder.
              </p>
            )}

            <div className="um-form-actions">
              <button
                type="button"
                className="um-cancel-btn"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="um-save-btn"
                disabled={saving}
              >
                <i className="bi bi-check2-circle me-2"></i>
                {saving
                  ? "Saving..."
                  : editingUserId !== null
                    ? "Save Changes"
                    : "Create User"}
              </button>
            </div>
          </form>
        )}

        <div className="table-responsive">
          <table className="table um-table align-middle">
            <thead>
              <tr>
                <th>User</th>
                <th>ID</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Account Action</th>
                <th>Special Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="um-empty">
                    Loading users from the database...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="um-user-cell">
                        <div className="um-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="um-user-details">
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="um-id">#{user.id}</span>
                    </td>

                    <td>{user.phone || "—"}</td>
                    <td>{user.address || "—"}</td>

                    <td>
                      <span className={`um-role-select role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`um-status ${
                          user.status === "Active"
                            ? "is-active"
                            : "is-inactive"
                        }`}
                      >
                        <span className="um-status-dot"></span>
                        {user.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={`um-status-btn ${
                          user.status === "Active"
                            ? "deactivate"
                            : "activate"
                        }`}
                        disabled={user.role === "owner"}
                        onClick={() => toggleStatus(user)}
                      >
                        {user.status === "Active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>

                    <td>
                      <div className="um-action-buttons">
                        <button
                          type="button"
                          className="um-icon-btn edit"
                          title="Edit user"
                          aria-label={`Edit ${user.name}`}
                          disabled={user.role === "owner"}
                          onClick={() => openEditForm(user)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <button
                          type="button"
                          className="um-icon-btn reset"
                          title="Reset password"
                          aria-label={`Reset password for ${user.name}`}
                          disabled={user.role === "owner"}
                          onClick={() => handleResetPassword(user)}
                        >
                          <i className="bi bi-key-fill"></i>
                        </button>

                        <button
                          type="button"
                          className="um-icon-btn delete"
                          title="Deactivate account"
                          aria-label={`Deactivate ${user.name}`}
                          disabled={
                            user.role === "owner" ||
                            user.status === "Inactive"
                          }
                          onClick={() => handleDelete(user)}
                        >
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="um-empty">
                    <i className="bi bi-search"></i>
                    <strong>No users found</strong>
                    <span>Try changing your search or filters.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="um-table-footer">
          <span>
            <i className="bi bi-shield-lock me-2"></i>
            Account changes are handled by the secure backend.
          </span>
        </div>
      </section>
    </div>
  );
}

export default UserManagement;
