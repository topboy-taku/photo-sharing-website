import { useNavigate } from "react-router-dom";

function HashtagList({ tags }) {
  const navigate = useNavigate();
  if (!tags || tags.length === 0) return null;
  const go = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <>
      {tags.map((tag) => (
        <button key={tag} type="button" className="tag tag--link" onClick={(e) => go(e, tag)}>
          #{tag}
        </button>
      ))}
    </>
  );
}

export default HashtagList;
