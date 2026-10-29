import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Feed from "../components/Feed";
import SearchInput from "../components/SearchInput";
import CreatePost from "../components/CreatePost";
import Friend from "../components/Friend";
import { api, getSession } from "../api/client";
import "./Home.css";

// Home page — toggles between "My Orbit" (local feed: you + friends) and
// "Explore" (global feed: everyone). All data comes from the API.
function Home() {
  const navigate = useNavigate();
  const [session] = useState(() => getSession());
  const [feedTab, setFeedTab] = useState("orbit");
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        feedTab === "orbit" ? await api.getLocalFeed(session.user._id) : await api.getGlobalFeed();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [feedTab, session]);

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    loadFeed();
  }, [loadFeed, session, navigate]);

  useEffect(() => {
    if (!session) return;
    api.getFriendRequests(session.user._id).then(setFriendRequests).catch(() => {});
  }, [session]);

  if (!session) return null;

  // Trending hashtags computed client-side from the currently loaded feed —
  // no dedicated endpoint needed for this lightweight widget.
  const hashtagCounts = {};
  for (const item of posts) {
    const tags = item.hashtags || [];
    for (const tag of tags) {
      if (hashtagCounts[tag]) {
        hashtagCounts[tag] = hashtagCounts[tag] + 1;
      } else {
        hashtagCounts[tag] = 1;
      }
    }
  }
  const trending = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <>
      <Header />
      <div className="page-layout">
        <main className="page-main home">
          <SearchInput
            placeholder="Search people by name or username…"
            onSearch={(term) => navigate(`/search?q=${encodeURIComponent(term)}`)}
          />

          <div className="home__toolbar">
            <div className="home__tabs">
              <button
                className={`btn ${feedTab === "orbit" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setFeedTab("orbit")}
              >
                My Orbit
              </button>
              <button
                className={`btn ${feedTab === "explore" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setFeedTab("explore")}
              >
                Explore
              </button>
            </div>
            <button className="btn btn-secondary" onClick={() => setShowComposer(!showComposer)}>
              + New post
            </button>
          </div>

          {showComposer && (
            <CreatePost
              onCreated={() => {
                setShowComposer(false);
                loadFeed();
              }}
              onCancel={() => setShowComposer(false)}
            />
          )}

          {loading && <p className="loading-text">Loading feed…</p>}
          {error && <p className="error-text">{error}</p>}
          {!loading && !error && <Feed posts={posts} favouriteId={session.user._id} />}
        </main>

        <aside className="home__sidebar">
          <Friend requests={friendRequests} onRequestHandled={() => api.getFriendRequests(session.user._id).then(setFriendRequests)} />

          {trending.length > 0 && (
            <div className="card home__widget">
              <h4>Trending hashtags</h4>
              {trending.map(([tag, count]) => (
                <p key={tag} className="home__hashtag">
                  <span className="tag">#{tag}</span> <span className="muted">· {count} posts</span>
                </p>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

export default Home;
