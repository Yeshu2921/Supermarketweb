import { useRef, useState } from "react";
import "./MyProfile.css";

const initialProfile = {
  firstName: "Supermarket",
  lastName: "User",
  email: "user@freshmart.com",
  phone: "",
  address: "",
  bio: "",
  profileImage: "",
};

function MyProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef(null);

  const fullName =
    `${profile.firstName} ${profile.lastName}`.trim();

  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`
      .toUpperCase();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setFormError("Image size must be less than 3 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfile((previous) => ({
        ...previous,
        profileImage: reader.result,
      }));

      setIsEditing(true);
      setFormError("");
      setMessage("");
    };

    reader.readAsDataURL(file);
  };

  const handleSave = (event) => {
    event.preventDefault();

    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      setFormError("First name and last name are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    const updatedProfile = {
      ...profile,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      address: profile.address.trim(),
      bio: profile.bio.trim(),
    };

    setProfile(updatedProfile);
    setSavedProfile(updatedProfile);
    setIsEditing(false);
    setFormError("");
    setMessage("Profile updated successfully.");
    setMessageType("success");
  };

  const handleCancel = () => {
    setProfile(savedProfile);
    setIsEditing(false);
    setFormError("");
    setMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setProfile((previous) => ({
      ...previous,
      profileImage: "",
    }));

    setIsEditing(true);
    setMessage("");
  };

  return (
    <div className="my-profile-page">
      <div className="my-profile-heading">
        <div>
          <h2>My Profile</h2>
          <p>Manage your personal information</p>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="profile-edit-btn"
            onClick={() => {
              setIsEditing(true);
              setMessage("");
              setFormError("");
            }}
          >
            <i className="bi bi-pencil-square"></i>
            Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className={`profile-alert-${messageType}`}>
          <i className="bi bi-check-circle-fill"></i>
          {message}
        </div>
      )}

      {formError && (
        <div className="profile-alert-error">
          <i className="bi bi-exclamation-circle-fill"></i>
          {formError}
        </div>
      )}

      <div className="my-profile-grid">
        <section className="profile-card profile-overview-card">
          <div className="profile-card-banner"></div>

          <div className="profile-overview-content">
            <div className="profile-avatar">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={fullName} />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {isEditing && (
              <div className="profile-photo-actions">
                <button
                  type="button"
                  className="profile-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="bi bi-camera"></i>
                  Change Photo
                </button>

                {profile.profileImage && (
                  <button
                    type="button"
                    className="profile-remove-photo-btn"
                    onClick={handleRemovePhoto}
                  >
                    Remove
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </div>
            )}

            <h3>{fullName || "Your Name"}</h3>
            <p className="profile-email">{profile.email}</p>

            <div className="profile-overview-divider"></div>

            <div className="profile-overview-item">
              <i className="bi bi-telephone"></i>
              <div>
                <span>Phone</span>
                <strong>{profile.phone || "Not provided"}</strong>
              </div>
            </div>

            <div className="profile-overview-item">
              <i className="bi bi-geo-alt"></i>
              <div>
                <span>Address</span>
                <strong>{profile.address || "Not provided"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-card profile-details-card">
          <div className="profile-section-heading">
            <div>
              <h3>Personal Information</h3>
              <p>Update your account details</p>
            </div>
            <i className="bi bi-person-lines-fill"></i>
          </div>

          <form onSubmit={handleSave}>
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="profile-form-group profile-full-width">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter your address"
                />
              </div>

              <div className="profile-form-group profile-full-width">
                <label htmlFor="bio">About Me</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  value={profile.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Write a short description..."
                />
              </div>
            </div>

            {isEditing && (
              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-save-btn"
                >
                  <i className="bi bi-check2"></i>
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}

export default MyProfile;