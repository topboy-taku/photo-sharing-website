import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
import ProfilePreview from "../components/ProfilePreview";
import { api, getSession } from "../api/client";
import "./Search.css";

// Search results page — searches users by display name or username.
function Search() {
  const navigate = useNavigate();
  const [session] = useState(() => getSession());
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = async (term) => {
    if (!term.trim()) return;
    setSearchParams({ q: term });
    setLoading(true);
    setError(null);
    try {
      setResults(await api.searchUsers(term));
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
  }, [session, navigate]);

  if (!session) return null;

  return (
    <>
      <Header />
      <main className="page-main search-page">
        <h2>Search</h2>
        <SearchInput placeholder="Search people by name or username…" onSearch={runSearch} />
        {loading && <p className="loading-text">Searching…</p>}
        {error && <p className="error-text">{error}</p>}
        {searched && !loading && results.length === 0 && <p className="muted">No results found.</p>}
        <div className="search-page__results">
          {results.map((user) => (
            <ProfilePreview key={user._id} user={user} />
          ))}
        </div>
      </main>
    </>
  );
}

export default Search;
