
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api";
import "./Categories.css";

const emptyForm = {
  name: "",
  parent_id: "",
  description: "",
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const isActive = (value) =>
    value === true || Number(value) === 1;

  async function loadCategories() {
    try {
      setError("");
      const data = await apiRequest("/categories");
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        (category.parent_name || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (category.description || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const active = isActive(category.is_active);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const activeCount = categories.filter((c) =>
    isActive(c.is_active)
  ).length;

  const subcategoryCount = categories.filter(
    (c) => c.parent_id !== null && c.parent_id !== undefined
  ).length;

  // Exclude the category being edited and its descendants
  // from the parent dropdown.
  function getUnavailableParentIds(categoryId) {
    const unavailable = new Set();

    if (!categoryId) return unavailable;

    unavailable.add(Number(categoryId));

    let changed = true;

    while (changed) {
      changed = false;

      categories.forEach((category) => {
        if (
          category.parent_id !== null &&
          category.parent_id !== undefined &&
          unavailable.has(Number(category.parent_id)) &&
          !unavailable.has(Number(category.id))
        ) {
          unavailable.add(Number(category.id));
          changed = true;
        }
      });
    }

    return unavailable;
  }

  function openAddForm() {
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
    setSuccessMessage("");
    setShowForm(true);
  }

  function openEditForm(category) {
    setEditingId(category.id);
    setFormData({
      name: category.name || "",
      parent_id: category.parent_id ?? "",
      description: category.description || "",
    });
    setError("");
    setSuccessMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = formData.name.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    const payload = {
      name,
      parent_id: formData.parent_id || null,
      description: formData.description.trim(),
    };

    try {
      if (editingId) {
        const data = await apiRequest(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setSuccessMessage(
          data.message || "Category updated successfully!"
        );
      } else {
        const data = await apiRequest("/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccessMessage(
          data.message || "Category created successfully!"
        );
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      await loadCategories();
    } catch (err) {
      setError(err.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(category) {
    const nextStatus = !isActive(category.is_active);
    const action = nextStatus ? "activate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${category.name}"?`
      )
    ) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const data = await apiRequest(
        `/categories/${category.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: nextStatus }),
        }
      );

      setSuccessMessage(
        data.message ||
          `Category ${nextStatus ? "activated" : "deactivated"} successfully!`
      );

      await loadCategories();
    } catch (err) {
      setError(err.message || "Failed to update category status.");
    }
  }

  async function deleteCategory(category) {
    if (
      !window.confirm(
        `Delete "${category.name}"?\n\nCategories used by products or containing subcategories cannot be deleted.`
      )
    ) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const data = await apiRequest(`/categories/${category.id}`, {
        method: "DELETE",
      });

      setSuccessMessage(
        data.message || "Category deleted successfully!"
      );

      await loadCategories();
    } catch (err) {
      setError(err.message || "Failed to delete category.");
    }
  }

  const unavailableParents = getUnavailableParentIds(editingId);

  return (
    <div className="categories-page">
      <div className="categories-header">
        <div>
          <h2>Categories Management</h2>
          <p>Organize your supermarket products and subcategories.</p>
        </div>

        <button
          type="button"
          className="category-add-btn"
          onClick={openAddForm}
        >
          <i className="bi bi-plus-lg"></i>
          Add Category
        </button>
      </div>

      {successMessage && (
        <div className="category-alert category-alert-success" role="status">
          <i className="bi bi-check-circle-fill"></i>
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss success message"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      {error && !showForm && (
        <div className="category-alert category-alert-error" role="alert">
          <i className="bi bi-exclamation-circle-fill"></i>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error message"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="category-stats">
        <div className="category-stat-card">
          <div className="category-stat-icon total-icon">
            <i className="bi bi-tags-fill"></i>
          </div>
          <div>
            <span>Total Categories</span>
            <h3>{categories.length}</h3>
          </div>
        </div>

        <div className="category-stat-card">
          <div className="category-stat-icon active-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div>
            <span>Active Categories</span>
            <h3>{activeCount}</h3>
          </div>
        </div>

        <div className="category-stat-card">
          <div className="category-stat-icon subcategory-icon">
            <i className="bi bi-diagram-3-fill"></i>
          </div>
          <div>
            <span>Subcategories</span>
            <h3>{subcategoryCount}</h3>
          </div>
        </div>
      </div>

      {/* Search and filter */}
      <div className="category-toolbar">
        <div className="category-search">
          <i className="bi bi-search"></i>
          <input
            type="search"
            placeholder="Search name, parent, or description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          aria-label="Filter categories by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Categories table */}
      <div className="category-table-card">
        <div className="category-table-heading">
          <div>
            <h3>All Categories</h3>
            <p>Manage categories and their status.</p>
          </div>
          <span className="category-result-count">
            {filteredCategories.length} results
          </span>
        </div>

        {loading ? (
          <div className="category-state">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading categories...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table category-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Parent Category</th>
                  <th>Subcategories</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className="category-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map((category) => {
                  const active = isActive(category.is_active);

                  return (
                    <tr key={category.id}>
                      <td>
                        <div className="category-name-cell">
                          <div className="category-row-icon">
                            <i className="bi bi-tag-fill"></i>
                          </div>
                          <div>
                            <strong>{category.name}</strong>
                            <small>
                              {category.description || "No description"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {category.parent_name ? (
                          <span className="category-parent-label">
                            <i className="bi bi-arrow-return-right"></i>
                            {category.parent_name}
                          </span>
                        ) : (
                          <span className="category-root-label">
                            Main category
                          </span>
                        )}
                      </td>

                      <td>{Number(category.subcategory_count || 0)}</td>
                      <td>{Number(category.product_count || 0)}</td>

                      <td>
                        <span
                          className={`category-status ${
                            active ? "status-active" : "status-inactive"
                          }`}
                        >
                          <span></span>
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="category-actions">
                          <button
                            type="button"
                            className="category-action edit-action"
                            onClick={() => openEditForm(category)}
                            title="Edit category"
                            aria-label={`Edit ${category.name}`}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>

                          <button
                            type="button"
                            className="category-action status-action"
                            onClick={() => toggleStatus(category)}
                            title={active ? "Deactivate" : "Activate"}
                            aria-label={`${active ? "Deactivate" : "Activate"} ${category.name}`}
                          >
                            <i
                              className={`bi ${
                                active ? "bi-toggle-on" : "bi-toggle-off"
                              }`}
                            ></i>
                          </button>

                          <button
                            type="button"
                            className="category-action delete-action"
                            onClick={() => deleteCategory(category)}
                            title="Delete category"
                            aria-label={`Delete ${category.name}`}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="category-empty">
                        <i className="bi bi-inbox"></i>
                        <h4>No categories found</h4>
                        <p>
                          {categories.length === 0
                            ? "Add your first category to get started."
                            : "Try another search or filter."}
                        </p>
                        {categories.length === 0 && (
                          <button
                            type="button"
                            className="category-add-btn"
                            onClick={openAddForm}
                          >
                            <i className="bi bi-plus-lg"></i>
                            Add Category
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div
          className="category-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            className="category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
          >
            <div className="category-modal-header">
              <div>
                <div className="category-modal-icon">
                  <i
                    className={`bi ${
                      editingId ? "bi-pencil-square" : "bi-tags-fill"
                    }`}
                  ></i>
                </div>
                <div>
                  <h3 id="category-modal-title">
                    {editingId ? "Edit Category" : "Add Category"}
                  </h3>
                  <p>
                    {editingId
                      ? "Update the category information."
                      : "Create a category or a subcategory."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="category-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="category-modal-body">
                {error && (
                  <div className="category-alert category-alert-error">
                    <i className="bi bi-exclamation-circle-fill"></i>
                    <span>{error}</span>
                  </div>
                )}

                <div className="category-form-group">
                  <label htmlFor="category-name">
                    Category Name <span>*</span>
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Beverages"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        name: event.target.value,
                      })
                    }
                    required
                    autoFocus
                  />
                </div>

                <div className="category-form-group">
                  <label htmlFor="category-parent">
                    Parent Category
                  </label>
                  <select
                    id="category-parent"
                    value={formData.parent_id}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        parent_id: event.target.value,
                      })
                    }
                  >
                    <option value="">None — Main Category</option>

                    {categories
                      .filter(
                        (category) =>
                          !unavailableParents.has(Number(category.id)) &&
                          isActive(category.is_active)
                      )
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.parent_name
                            ? `${category.parent_name} → ${category.name}`
                            : category.name}
                        </option>
                      ))}
                  </select>

                  <small>
                    Leave this empty to create a main category.
                  </small>
                </div>

                <div className="category-form-group">
                  <label htmlFor="category-description">
                    Description
                  </label>
                  <textarea
                    id="category-description"
                    rows={4}
                    placeholder="Describe the category (optional)"
                    value={formData.description}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        description: event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="category-modal-footer">
                <button
                  type="button"
                  className="category-cancel-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="category-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i
                        className={`bi ${
                          editingId ? "bi-check-lg" : "bi-plus-lg"
                        }`}
                      ></i>
                      {editingId ? "Save Changes" : "Create Category"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;
