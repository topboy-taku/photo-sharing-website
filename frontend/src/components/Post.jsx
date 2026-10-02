import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getSession } from "../api/client";
import Image from "./Image";
import Comments from "./Comments";
import EditPost from "./EditPost";
import "./Post.css";


// hashtags, album link, like/comment counts and owner actions.
function Post({ post, onUpdated, onDeleted }) {
  const navigate = useNavigate();
  const [session] = useState(() => getSession());
  const [editing, setEditing] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [liking, setLiking] = useState(false);
  const [reportMsg, setReportMsg] = useState(null);

  const author = localPost.author || {};
  const isOwner = session?.user?._id === author._id;
  const liked = session?.user && (localPost.likes || []).some((l) => l === session.user._id || l?._id === session.user._id);

  const doLike = async () => {
    if (!session) return navigate("/");
    setLiking(true);
    try {
      const res = await api.likePost(localPost._id);
      setLocalPost((p) => ({ ...p, likes: new Array(res.likes).fill(res.liked ? session.user._id : null) }));
    } finally {
      setLiking(false);
    }
  };

  const HR = async () => {
    try {
      await api.reportPost(localPost._id, "Inappropriate");
      setReportMsg("Reported. Thanks for flagging this.");
    } catch (err) {
      setReportMsg(err.message); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try {
      await api.deletePost(localPost._id);
      onDeleted?.(localPost._id);
      navigate("/home");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCommentAdded = (comment) => {
    setLocalPost((p) => ({ ...p, comments: [...p.comments, comment] }));
  };

  if (editing) {
    return (
      <EditPost
        post={localPost}
        onSave={(updated) => {
          setLocalPost(updated);
          onUpdated?.(updated);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <article className="post">
      <Image src={localPost.image} alt={localPost.description} />

      <div className="post__header">
        <h2>{localPost.description.slice(0, 60)}</h2>
        <div className="post__actions">
          <button className="btn btn-outline" onClick={HR}>
            ⚑ Report
          </button>
          <button className={`btn ${liked ? "btn-primary" : "btn-outline"}`} onClick={doLike} disabled={liking}>
            ♡ Like
          </button>
          {isOwner && (
            <>
              <button className="btn btn-outline" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <p className="post__description">{localPost.description}</p>

      <div className="post__tags">
        {(localPost.hashtags || []).map((tag) => (
          <span key={tag} className="tag">
            #{tag}{" "}
          </span>
        ))}
      </div>

      {localPost.album && (
        <p className="muted">
          Part of album:{" "}
          <Link
            to={`/album/${typeof localPost.album === "string" ? localPost.album : localPost.album._id}`}
            className="post__album-link"
          >
            view album →
          </Link>
        </p>
      )}

      <p className="muted post__stats">
        {(localPost.likes || []).length} likes · {(localPost.comments || []).length} comments · Posted{" "}
        {new Date(localPost.createdAt).toLocaleDateString()}
      </p>
      {reportMsg && <p className="muted">{reportMsg}</p>}

      <div className="post__author card">
        {author.profileImage ? (
          <img src={author.profileImage} alt={author.displayName} className="post__author-avatar" />
        ) : (
          <div className="avatar-fallback post__author-avatar">{author.displayName?.[0]?.toUpperCase()}</div>
        )}
        <div>
          <p className="post__author-name">{author.displayName}</p>
          <p className="muted">@{author.username}</p>
        </div>
        <Link to={`/profile/${author._id}`} className="btn btn-outline post__author-view">
          View profile
        </Link>
      </div>

      <Comments postId={localPost._id} comments={localPost.comments || []} onCommentAdded={handleCommentAdded} />
    </article>
  );
}

export default Post;
