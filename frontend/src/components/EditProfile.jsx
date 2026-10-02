import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fileToDataUrl, clearSession } from "../api/client";
import "./EditProfile.css";

function EditProfile({ user, onCancel, onSaved }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [pronouns, setPronouns] = useState(user.pronouns || "");
  const [bio, setBio] = useState(user.bio || "");
  const [links, setLinks] = useState(user.links?.join(", ") || "");
  const [profileImage, setProfileImage] = useState(user.profileImage || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
  if(file) setProfileImage(await fileToDataUrl(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const linksArray = links
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      const res = await api.updateProfile(user._id, {
        displayName,
       username,
      pronouns,
        bio,
        links: linksArray,
        profileImage,
      });
           onSaved?.(res.user);
    }catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your account? This can't be undone.")) return;
    try {
      await api.deleteProfile(user._id);
      clearSession();
      navigate("/");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <form className="edit-profile card" onSubmit={handleSubmit}>
      <h3>Edit profile</h3>
      <p className="muted">Only the logged-in user can reach this page.</p>

      <div className="edit-profile__dropzone">
        {profileImage ? (
          <img src={profileImage} alt={displayName} />
        ) : (
          <div className="avatar-fallback edit-profile__avatar-fallback">{displayName?.[0]?.toUpperCase()}</div>
        )}
        <span className="muted">drop an image here, or click to upload</span>
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      <div className="form-group">
        <label htmlFor="ep-name">Display name</label>
        <input id="ep-name" className="input-field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>

      <div className="form-group">
        <label htmlFor="ep-username">Username</label>
        <input id="ep-username" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>

      <div className="form-group">
        <label htmlFor="ep-pronouns">Pronouns</label>
        <input id="ep-pronouns" className="input-field" value={pronouns} onChange={(e) => setPronouns(e.target.value)} />
      </div>

      <div className="form-group">
        <label htmlFor="ep-bio">Short bio (public)</label>
        <textarea id="ep-bio" className="input-field" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      <div className="form-group">
        <label htmlFor="ep-links">Social links (comma separated)</label>
        <input id="ep-links" className="input-field" value={links} onChange={(e) => setLinks(e.target.value)} />
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="edit-profile__actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          Delete my account
        </button>
      </div>
    </form>
  );
}

export default EditProfile;
