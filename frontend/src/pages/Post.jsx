import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Post from "../components/Post";
import { api, getSession } from "../api/client";
import "./Post.css";

// Post page — uses a dynamic route (/post/:id).
function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session] = useState(() => getSession());
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPost(await api.getPost(id));
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
    load();
  }, [load, session, navigate]);

  if (!session) return null;

  return (
    <>
      <Header />
      <main className="page-main post-page">
        {loading && <p className="loading-text">Loading post…</p>}
        {error && <p className="error-text">{error}</p>}
        {post && (
          <>
            <p className="muted post-page__breadcrumb">
              <Link to="/home">← Back to feed</Link> / @{post.author?.username}
            </p>
            <Post post={post} onUpdated={setPost} />
          </>
        )}
      </main>
    </>
  );
}

export default PostPage;
