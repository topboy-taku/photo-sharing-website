import { useState } from "react";
import { api } from "../api/client";
import "./CreatePost.css";

function EditPost({ post, onSave, onCancel }) {
  const [description, setDescription] = useState(post.description);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState(post.hashtags || []);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const next = {};
    if(!description.trim()) {
      next.description = "A description is required.";
    }else if (description.trim().length < 5) {
      next.description = "Description must be at least 5 characters.";
    }
    if (hashtags.length === 0) next.hashtags = "Add at least one hashtag.";
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
      const updated = await api.updatePost(post._id, { description, hashtags });
      onSave?.(updated);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="create-post card" onSubmit={handleSubmit} noValidate>
      <h3>Edit post</h3>
      <img src={post.image} alt={post.description} className="create-post__preview" />
      <p className="muted">(image cannot be changed when editing an existing post)</p>

      <div className="form-group">
        <label htmlFor="edit-post-description">Description</label>
        <textarea
          id="edit-post-description"
          className={`input-field ${errors.description ? "input-error" : ""}`}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && <p className="field-error">{errors.description}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="edit-post-hashtags">Hashtags</label>
        <input
          id="edit-post-hashtags"
          type="text"
          className={`input-field ${errors.hashtags ? "input-error" : ""}`}
          placeholder="#type a tag and press enter"
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
          onKeyDown={handleAddHashtag}
        />
        <div className="create-post__tags">
          {hashtags.map((tag) => (
            <span key={tag} className="create-post__chip">
              #{tag}{" "}
              <button type="button" onClick={() => RH(tag)}>
                ✕
              </button>
            </span>
          ))}
        </div>
        {errors.hashtags && <p className="field-error">{errors.hashtags}</p>}
      </div>

      {serverError && <p className="field-error">{serverError}</p>}

      <div className="create-post__actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
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

export default EditPost;
