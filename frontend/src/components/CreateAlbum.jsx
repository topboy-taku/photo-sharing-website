import { useState } from "react";
import { api } from "../api/client";
import "./CreateAlbum.css";

// Form to create a new album — name, description, and hashtags.
function CreateAlbum({ onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Album name is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddHashtag = (e) => {
    if (e.key === "Enter" && hashtagInput.trim()) {
      e.preventDefault();
      const clean = hashtagInput.trim().replace(/^#/, "");
      if (/^[a-zA-Z0-9]+$/.test(clean) && !hashtags.includes(clean)) {
        setHashtags([...hashtags, clean]);
      }
      setHashtagInput("");
    }
  };

  const RH = (tag) => setHashtags(hashtags.filter((t) => t !== tag));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const album = await api.createAlbum({ name, description, hashtags });
      onCreated?.(album);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="create-album card" onSubmit={handleSubmit} noValidate>
      <h3>New album</h3>
      <div className="form-group">
        <label htmlFor="album-name">Album name</label>
        <input
          id="album-name"
          className={`input-field ${errors.name ? "input-error" : ""}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>
      <div className="form-group">
        <label htmlFor="album-description">Description</label>
        <textarea
          id="album-description"
          className="input-field"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="album-hashtags">Hashtags</label>
        <input
          id="album-hashtags"
          className="input-field"
          placeholder="#type a tag and press enter"
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
          onKeyDown={handleAddHashtag}
        />
        <div className="create-album__tags">
          {hashtags.map((tag) => (
            <span key={tag} className="create-album__chip">
              #{tag}{" "}
              <button type="button" onClick={() => RH(tag)}>
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
      {serverError && <p className="field-error">{serverError}</p>}
      <div className="create-album__actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create album"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default CreateAlbum;
