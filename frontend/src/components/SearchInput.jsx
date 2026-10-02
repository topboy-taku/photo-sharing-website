import { useState } from "react";
import "./SearchInput.css";

// Handles entering a search term and calling back with it on submit.
function SearchInput({ onSearch, placeholder = "Search Orbit…" }) {
  const [term, setTerm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(term);
  };

  return (
    <form className="search-input" onSubmit={handleSubmit}>
      <span className="search-input__icon">🔍</span>
      <input
        type="text"
        className="input-field"
        placeholder={placeholder}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
    </form>
  );
}

export default SearchInput;
