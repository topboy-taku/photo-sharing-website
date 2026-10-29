import { useState } from "react";
import { api } from "../api/client";
import "./Comments.css";

// Displays all comments left on a post, plus a box to write a new one.
function Comments({ postId, comments, onCommentAdded }) {
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

         const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const comment = await api.commentOnPost(postId, draft.trim());
      onCommentAdded?.(comment);
      setDraft("");
    } catch (err) {
      setError(err.message);
    } finally{
      setSubmitting(false);
    }
  };

  return (
    <div className="comments">
      <h4>Comments ({comments.length})</h4>
      <ul className="comments__list">
    {comments.map((comment) => (
          <li key={comment._id} className="comments__item">
            <span className="comments__author">@{comment.author?.username}</span>
            <span className="comments__text">{comment.text}</span>
          </li>
        ))}
        {comments.length === 0 && <p className="muted">No comments yet.</p>}
      </ul>

      <form className="comments__form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="input-field"
          placeholder="Write a comment…"
      value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary" disabled={submitting}>
          Post
        </button>
      </form>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export default Comments;
