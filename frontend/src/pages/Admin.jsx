import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { api, getSession } from "../api/client";
import "./Admin.css";

const TABS = ["Reported posts", "Hidden posts", "Users", "Albums", "Report reasons"];

// Admin-only page: moderate reported/hidden posts, manage users and albums,
// and maintain the predefined list of report reasons. Not linked to from the
// header unless the logged-in user is an admin.
function Admin() {
  const navigate = useNavigate();
  const [session] = useState(() => getSession());
  const [tab, setTab] = useState(TABS[0]);

  const [reportedPosts, setReportedPosts] = useState([]);
  const [hiddenPosts, setHiddenPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [newReasonText, setNewReasonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [userBeingEdited, setUserBeingEdited] = useState(null);
  const [editFields, setEditFields] = useState({ displayName: "", username: "", bio: "" });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rp, hp, u, a, r] = await Promise.all([
        api.getReportedPosts(),
        api.getHiddenPosts(),
        api.getAllUsersAdmin(),
        api.getAllAlbumsAdmin(),
        api.getReportReasons(),
      ]);
      setReportedPosts(rp);
      setHiddenPosts(hp);
      setUsers(u);
      setAlbums(a);
      setReasons(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    if (!session.user?.isAdmin) {
      navigate("/home");
      return;
    }
    loadAll();
  }, [session, navigate, loadAll]);

  if (!session || !session.user?.isAdmin) return null;

  const runAction = async (id, action) => {
    setSavingId(id);
    try {
      await action();
      await loadAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleVisibility = (post) =>
    runAction(post._id, () => api.setPostVisibility(post._id, !post.hidden));

  const handleDeletePost = (post) => {
    if (!window.confirm(`Delete "${post.description.slice(0, 40)}…"? This can't be undone.`)) return;
    runAction(post._id, () => api.deletePost(post._id));
  };

  const handleDeleteUser = (user) => {
    if (user._id === session.user._id) return alert("You can't delete your own admin account from here.");
    if (!window.confirm(`Delete account "${user.displayName}" (@${user.username})? This can't be undone.`)) return;
    runAction(user._id, () => api.deleteProfile(user._id));
  };

  const openUserEditor = (user) => {
    setUserBeingEdited(user._id);
    setEditFields({ displayName: user.displayName, username: user.username, bio: user.bio || "" });
  };

  const submitUserEdit = async (e, userId) => {
    e.preventDefault();
    await runAction(userId, () => api.updateProfile(userId, editFields));
    setUserBeingEdited(null);
  };

  const handleDeleteAlbum = (album) => {
    if (!window.confirm(`Delete album "${album.name}"? This can't be undone.`)) return;
    runAction(album._id, () => api.deleteAlbum(album._id));
  };

  const handleAddReason = async (e) => {
    e.preventDefault();
    if (!newReasonText.trim()) return;
    try {
      await api.addReportReason(newReasonText.trim());
      setNewReasonText("");
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteReason = (reason) => {
    if (!window.confirm(`Remove reason "${reason.label}"?`)) return;
    runAction(reason._id, () => api.deleteReportReason(reason._id));
  };

  return (
    <>
      <Header />
      <main className="page-main admin-page">
        <h2>Admin</h2>
        <p className="muted">Moderate content and manage accounts across Orbit.</p>

        <div className="admin-page__tabs">
          {TABS.map((t) => (
            <button key={t} className={`btn ${tab === t ? "btn-primary" : "btn-outline"}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {loading && <p className="loading-text">Loading admin data…</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <>
            {tab === "Reported posts" && (
              <section className="admin-page__section">
                {reportedPosts.length === 0 && <p className="muted">No posts have been reported.</p>}
                {reportedPosts.map((post) => (
                  <div key={post._id} className="card admin-row">
                    <div className="admin-row__main">
                      <Link to={`/post/${post._id}`}>{post.description.slice(0, 70)}</Link>
                      <p className="muted">
                        by @{post.author?.username} · {post.reports.length} report
                        {post.reports.length === 1 ? "" : "s"} · {post.hidden ? "hidden" : "visible"}
                      </p>
                      <p className="muted admin-row__reasons">
                        {post.reports.map((r, i) => `${r.reason} (@${r.reporter?.username || "?"})`).join(", ")}
                      </p>
                    </div>
                    <div className="admin-row__actions">
                      <button
                        className="btn btn-outline"
                        disabled={savingId === post._id}
                        onClick={() => handleToggleVisibility(post)}
                      >
                        {post.hidden ? "Unhide" : "Hide"}
                      </button>
                      <button className="btn btn-danger" disabled={savingId === post._id} onClick={() => handleDeletePost(post)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {tab === "Hidden posts" && (
              <section className="admin-page__section">
                {hiddenPosts.length === 0 && <p className="muted">No hidden posts.</p>}
                {hiddenPosts.map((post) => (
                  <div key={post._id} className="card admin-row">
                    <div className="admin-row__main">
                      <Link to={`/post/${post._id}`}>{post.description.slice(0, 70)}</Link>
                      <p className="muted">by @{post.author?.username}</p>
                    </div>
                    <div className="admin-row__actions">
                      <button
                        className="btn btn-outline"
                        disabled={savingId === post._id}
                        onClick={() => handleToggleVisibility(post)}
                      >
                        Unhide
                      </button>
                      <button className="btn btn-danger" disabled={savingId === post._id} onClick={() => handleDeletePost(post)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {tab === "Users" && (
              <section className="admin-page__section">
                {users.map((u) =>
                  userBeingEdited === u._id ? (
                    <form key={u._id} className="card admin-row admin-row--editing" onSubmit={(e) => submitUserEdit(e, u._id)}>
                      <div className="form-group">
                        <label htmlFor={`edit-name-${u._id}`}>Display name</label>
                        <input
                          id={`edit-name-${u._id}`}
                          className="input-field"
                          value={editFields.displayName}
                          onChange={(e) => setEditFields({ ...editFields, displayName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`edit-username-${u._id}`}>Username</label>
                        <input
                          id={`edit-username-${u._id}`}
                          className="input-field"
                          value={editFields.username}
                          onChange={(e) => setEditFields({ ...editFields, username: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`edit-bio-${u._id}`}>Bio</label>
                        <textarea
                          id={`edit-bio-${u._id}`}
                          className="input-field"
                          rows={2}
                          value={editFields.bio}
                          onChange={(e) => setEditFields({ ...editFields, bio: e.target.value })}
                        />
                      </div>
                      <div className="admin-row__actions">
                        <button type="submit" className="btn btn-primary" disabled={savingId === u._id}>
                          Save
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => setUserBeingEdited(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div key={u._id} className="card admin-row">
                      <div className="admin-row__main">
                        <Link to={`/profile/${u._id}`}>{u.displayName}</Link>
                        <p className="muted">
                          @{u.username} · {u.email} {u.isAdmin && "· admin"}
                        </p>
                      </div>
                      <div className="admin-row__actions">
                        <button className="btn btn-outline" onClick={() => openUserEditor(u)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          disabled={savingId === u._id}
                          onClick={() => handleDeleteUser(u)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )}
              </section>
            )}

            {tab === "Albums" && (
              <section className="admin-page__section">
                {albums.length === 0 && <p className="muted">No albums yet.</p>}
                {albums.map((album) => (
                  <div key={album._id} className="card admin-row">
                    <div className="admin-row__main">
                      <Link to={`/album/${album._id}`}>{album.name}</Link>
                      <p className="muted">by @{album.owner?.username} · {(album.posts || []).length} posts</p>
                    </div>
                    <div className="admin-row__actions">
                      <button className="btn btn-danger" disabled={savingId === album._id} onClick={() => handleDeleteAlbum(album)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {tab === "Report reasons" && (
              <section className="admin-page__section">
                <form className="admin-page__add-reason" onSubmit={handleAddReason}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Add a new reason, e.g. 'Hate speech'"
                    value={newReasonText}
                    onChange={(e) => setNewReasonText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">
                    Add reason
                  </button>
                </form>
                {reasons.map((r) => (
                  <div key={r._id} className="card admin-row">
                    <div className="admin-row__main">{r.label}</div>
                    <div className="admin-row__actions">
                      <button className="btn btn-danger" disabled={savingId === r._id} onClick={() => handleDeleteReason(r)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default Admin;
