import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getSession } from "../api/client";
import Image from "./Image";
import Comments from "./Comments";
import EditPost from "./EditPost";
import HashtagList from "./HashtagList";
import "./Post.css";

// A full post view: image, description, hashtags, album link, like/comment
// counts, comments, and owner actions (edit/delete) or reporting.
function Post({ post, onUpdated, onDeleted }) {
  const navigate = useNavigate();
  const [session] = useState(() => getSession());
  const [editing, setEditing] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [liking, setLiking] = useState(false);
  const [reportMsg, setReportMsg] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReasons, setReportReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const author = localPost.author || {};
  const isOwner = session?.user?._id === author._id || !!session?.user?.isAdmin;
  const myId = session?.user?._id;
  const [likeCount, setLikeCount] = useState((post.likes || []).length);
  const [iLikedIt, setILikedIt] = useState((post.likes || []).includes(myId));

  const doLike = async () => {
    if (!session) return navigate("/");
    setLiking(true);
    try {
      const res = await api.likePost(localPost._id);
      setLikeCount(res.likes);
      setILikedIt(res.liked);
    } finally {
      setLiking(false);
    }
  };

  const openReportForm = async () => {
    if (!session) return navigate("/");
    setReportOpen(true);
    setReportMsg(null);
    if (reportReasons.length === 0) {
      try {
        const reasons = await api.getReportReasons();
        setReportReasons(reasons);
        if (reasons[0]) setSelectedReason(reasons[0].label);
      } catch (err) {
        setReportMsg(err.message);
      }
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!selectedReason) return;
    setReporting(true);
    try {
      await api.reportPost(localPost._id, selectedReason);
      setReportMsg("Reported. Thanks for flagging this.");
      setReportOpen(false);
    } catch (err) {
      setReportMsg(err.message);
    } finally {
      setReporting(false);
    }
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
      {localPost.hidden && (
        <p className="post__hidden-notice">
          This post is hidden from feeds (reported more than twice). Only you{session?.user?.isAdmin ? " and admins" : ""} can see it here.
        </p>
      )}
      <Image src={localPost.image} alt={localPost.description} />

      <div className="post__header">
        <h2>{localPost.description.slice(0, 60)}</h2>
        <div className="post__actions">
          <button className="btn btn-outline" onClick={openReportForm}>
            ⚑ Report
          </button>
          <button className={`btn ${iLikedIt ? "btn-primary" : "btn-outline"}`} onClick={doLike} disabled={liking}>
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

      {reportOpen && (
        <form className="card post__report-form" onSubmit={submitReport}>
          <label htmlFor="report-reason">Why are you reporting this post?</label>
          {reportReasons.length === 0 ? (
            <p className="muted">Loading reasons…</p>
          ) : (
            <select
              id="report-reason"
              className="input-field"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              {reportReasons.map((r) => (
                <option key={r._id} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
          )}
          <div className="post__report-actions">
            <button type="submit" className="btn btn-primary" disabled={reporting || reportReasons.length === 0}>
              {reporting ? "Submitting…" : "Submit report"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setReportOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <p className="post__description">{localPost.description}</p>

      <div className="post__tags">
        <HashtagList tags={localPost.hashtags} />
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
        {likeCount} likes · {(localPost.comments || []).length} comments · Posted{" "}
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
