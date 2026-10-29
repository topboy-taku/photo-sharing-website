import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
import ProfilePreview from "../components/ProfilePreview";
import PostPreview from "../components/PostPreview";
import AlbumPreview from "../components/AlbumPreview";
import { api, getSession } from "../api/client";
import "./Search.css";

// Search results page — searches users (name/username/email), posts
// (description or hashtags) and albums (name/description/hashtags) at once.
// Clicking a hashtag anywhere in the app lands here with that tag as the
// search term, so hashtag search and text search share this one page.
function Search() {
  const navigate = useNavigate();
  const [session] = useState(() => getSession());
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [term, setTerm] = useState(initialQuery);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = async (value) => {
    if (!value.trim()) return;
    setTerm(value);
    setSearchParams({ q: value });
    setLoading(true);
    setError(null);
    try {
      const [userResults, postResults, albumResults] = await Promise.all([
        api.searchUsers(value),
        api.searchPosts(value),
        api.searchAlbums(value),
      ]);
      setUsers(userResults);
      setPosts(postResults);
      setAlbums(albumResults);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    if (initialQuery) runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, navigate, initialQuery]);

  if (!session) return null;

  const totalResults = users.length + posts.length + albums.length;

  return (
    <>
      <Header />
      <main className="page-main search-page">
        <h2>Search</h2>
        <SearchInput
          placeholder="Search people, posts, albums, or #hashtags…"
          onSearch={runSearch}
        />
        {loading && <p className="loading-text">Searching…</p>}
        {error && <p className="error-text">{error}</p>}
        {searched && !loading && totalResults === 0 && (
          <p className="muted">No results for "{term}".</p>
        )}

        {users.length > 0 && (
          <section className="search-page__section">
            <h3>People ({users.length})</h3>
            <div className="search-page__results">
              {users.map((user) => (
                <ProfilePreview key={user._id} user={user} />
              ))}
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section className="search-page__section">
            <h3>Posts ({posts.length})</h3>
            <div className="search-page__results search-page__results--grid">
              {posts.map((post) => (
                <PostPreview key={post._id} post={post} />
              ))}
            </div>
          </section>
        )}

        {albums.length > 0 && (
          <section className="search-page__section">
            <h3>Albums ({albums.length})</h3>
            <div className="search-page__results search-page__results--grid">
              {albums.map((album) => (
                <AlbumPreview key={album._id} album={album} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default Search;
