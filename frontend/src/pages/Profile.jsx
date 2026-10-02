import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ProfileComponent from "../components/Profile";
import EditProfile from "../components/EditProfile";
import CreatePost from "../components/CreatePost";
import CreateAlbum from "../components/CreateAlbum";
import PostPreview from "../components/PostPreview";
import AlbumPreview from "../components/AlbumPreview";
import Friend from "../components/Friend";
import { api, getSession } from "../api/client";
import "./Profile.css";

// Profile page — uses a dynamic route (/profile/:id).
function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session] = useState(() => getSession());

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [friends, setFriends] = useState([]);
  const [editing, setEditing] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [showAlbumComposer, setShowAlbumComposer] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile = session?.user?._id === id;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await api.getProfile(id);
      setUser(u);
      if (!u.restricted) {
        const [p, a, f] = await Promise.all([
          api.getUserPosts(id),
          api.getUserAlbums(id),
          api.getFriends(id),
        ]);
        setPosts(p);
        setAlbums(a);
        setFriends(f);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    loadProfile();
  }, [loadProfile, session, navigate]);

  if (!session) return null;
  if (loading) {
    return (
      <>
        <Header />
        <main className="page-main">
          <p className="loading-text">Loading profile…</p>
        </main>
      </>
    );
  }
  if (error || !user) {
    return (
      <>
        <Header />
        <main className="page-main">
          <p className="error-text">{error || "Profile not found."}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page-main profile-page">
        {editing ? (
          <EditProfile
            user={user}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              loadProfile();
            }}
          />
        ) : (
          <>
            <ProfileComponent user={user} onEditClick={() => setEditing(true)} onFriendshipChanged={loadProfile} />

            {!user.restricted && (
              <div className="profile-page__layout">
                <div className="profile-page__main">
                  <div className="profile-page__tabs">
                    <button
                      className={`btn ${activeTab === "posts" ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setActiveTab("posts")}
                    >
                      Posts
                    </button>
                    <button
                      className={`btn ${activeTab === "albums" ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setActiveTab("albums")}
                    >
                      Albums
                    </button>
                    {isOwnProfile && activeTab === "posts" && (
                      <button
                        className="btn btn-secondary profile-page__new"
                        onClick={() => setShowPostComposer(!showPostComposer)}
                      >
                        + Create post
                      </button>
                    )}
                    {isOwnProfile && activeTab === "albums" && (
                      <button
                        className="btn btn-secondary profile-page__new"
                        onClick={() => setShowAlbumComposer(!showAlbumComposer)}
                      >
                        + Create album
                      </button>
                    )}
                  </div>

                  {showPostComposer && (
                    <CreatePost
                      onCreated={() => {
                        setShowPostComposer(false);
                        loadProfile();
                      }}
                      onCancel={() => setShowPostComposer(false)}
                    />
                  )}
                  {showAlbumComposer && (
                    <CreateAlbum
                      onCreated={() => {
                        setShowAlbumComposer(false);
                        loadProfile();
                      }}
                      onCancel={() => setShowAlbumComposer(false)}
                    />
                  )}

                  {activeTab === "posts" && (
                    <div className="profile-page__grid">
                      {posts.map((post) => (
                        <PostPreview key={post._id} post={post} />
                      ))}
                      {posts.length === 0 && <p className="muted">No posts yet.</p>}
                    </div>
                  )}
                  {activeTab === "albums" && (
                    <div className="profile-page__grid">
                      {albums.map((album) => (
                        <AlbumPreview key={album._id} album={album} />
                      ))}
                      {albums.length === 0 && <p className="muted">No albums yet.</p>}
                    </div>
                  )}
                </div>

                <aside className="profile-page__sidebar">
                  <Friend friends={friends} title="Friends" />
                </aside>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default ProfilePage;
