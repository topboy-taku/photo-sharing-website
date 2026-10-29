import { useState } from "react";
import { api, fileToDataUrl } from "../api/client";
import "./CreatePost.css";

function CreatePost({ onCreated, onCancel, albumId = null }) {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const next = {};
    if (!image) next.image = "Choose an image to post.";
    if (!description.trim()) {
      next.description = "A description is required.";
    } else if (description.trim().length < 5) {
      next.description = "Description must be at least 5 characters.";
    }
    if (hashtags.length === 0) next.hashtags = "Please add at least one hashtag.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAddHashtag = (e) => {
    if (e.key === "Enter" && hashtagInput.trim()) {
      e.preventDefault();
      const clean = hashtagInput.trim().replace(/^#/, "");
      if(/^[a-zA-Z0-9]+$/.test(clean) && !hashtags.includes(clean)) {
        setHashtags([...hashtags, clean]);
      }
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag) =>   setHashtags(hashtags.filter((t) => t !== tag));
     const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) setImage(await fileToDataUrl(file));
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try{
      const post = await api.createPost({ description, image, hashtags, albumId });
      onCreated?.(post);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="create-post card" onSubmit={handlePublish} noValidate>
      <h3>New post</h3>

      <div className="form-group">
        <label htmlFor="post-image">Image</label>
        <div className={`create-post__dropzone ${errors.image ? "input-error" : ""}`}>
          {image ? (
            <img src={image} alt="Preview" className="create-post__preview" />
          ) : (
            <span className="muted">Drag an image here, or click to browse</span>
          )}
          <input id="post-image" type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        {errors.image && <p className="field-error">{errors.image}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="post-description">Description</label>
        <textarea
          id="post-description"
          className={`input-field ${errors.description ? "input-error" : ""}`}
          rows={3}
          placeholder="Text description of the photo…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && <p className="field-error">{errors.description}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="post-hashtags">Hashtags</label>
        <input
          id="post-hashtags"
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
              <button type="button" onClick={() => removeHashtag(tag)}>
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
          {submitting ? "Publishing…" : "Publish post"}
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

export default CreatePost;
