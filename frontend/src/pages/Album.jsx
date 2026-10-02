import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import PostPreview from "../components/PostPreview";
import { api, getSession } from "../api/client";
import "./Album.css";

// Album page — view an album's posts, and (owner-only) edit/delete the album
// or add/remove posts from it.
function AlbumPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session] = useState(() => getSession());

  const [album, setAlbum] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addPostId, setAddPostId] = useState("");

  const isOwner = session?.user?._id === album?.owner?._id;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const a = await api.getAlbum(id);
      setAlbum(a);
      setName(a.name);
      setDescription(a.description || "");
      if (session?.user?._id === a.owner?._id) {
        const userPosts = await api.getUserPosts(session.user._id);
        setMyPosts(userPosts.filter((p) => !p.album));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, session]);

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    load();
  }, [load, session, navigate]);

  if (!session) return null;

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateAlbum(id, { name, description });
      setEditing(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this album? Posts inside it will not be deleted.")) return;
    try {
      await api.deleteAlbum(id);
      navigate(`/profile/${session.user._id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddPost = async () => {
    if (!addPostId) return;
    try {
      await api.addPostToAlbum(id, addPostId);
      setAddPostId("");
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemovePost = async (postId) => {
    try {
      await api.removePostFromAlbum(id, postId);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <Header />
      <main className="page-main album-page">
        {loading && <p className="loading-text">Loading album…</p>}
        {error && <p className="error-text">{error}</p>}
        {album && (
          <>
            <p className="muted album-page__breadcrumb">
              <Link to={`/profile/${album.owner?._id}`}>← Back to @{album.owner?.username}</Link>
            </p>

            {editing ? (
              <form className="card album-page__edit-form" onSubmit={handleSaveEdit}>
                <div className="form-group">
                  <label htmlFor="album-edit-name">Album name</label>
                  <input id="album-edit-name" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="album-edit-description">Description</label>
                  <textarea
                    id="album-edit-description"
                    className="input-field"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="album-page__actions">
                  <button type="submit" className="btn btn-primary">
                    Save changes
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="card album-page__header">
                <h2>{album.name}</h2>
                <p className="muted">{album.description}</p>
                <p className="muted">
                  {(album.hashtags || []).map((t) => `#${t} `)}
                  {album.posts.length} posts · by @{album.owner?.username}
                </p>
                {isOwner && (
                  <div className="album-page__actions">
                    <button className="btn btn-outline" onClick={() => setEditing(true)}>
                      Edit album
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete}>
                      Delete album
                    </button>
                  </div>
                )}
              </div>
            )}

            {isOwner && myPosts.length > 0 && (
              <div className="card album-page__add-post">
                <label htmlFor="add-post-select">Add one of your posts to this album</label>
                <div className="album-page__add-row">
                  <select id="add-post-select" className="input-field" value={addPostId} onChange={(e) => setAddPostId(e.target.value)}>
                    <option value="">Select a post…</option>
                    {myPosts.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.description.slice(0, 40)}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-secondary" onClick={handleAddPost}>
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="album-page__grid">
              {album.posts.map((post) => (
                <div key={post._id} className="album-page__post-wrap">
                  <PostPreview post={post} />
                  {isOwner && (
                    <button className="btn btn-outline album-page__remove" onClick={() => handleRemovePost(post._id)}>
                      remove ✕
                    </button>
                  )}
                </div>
              ))}
              {album.posts.length === 0 && <p className="muted">No posts in this album yet.</p>}
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default AlbumPage;
