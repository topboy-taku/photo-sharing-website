import { Link } from "react-router-dom";
import "./PostPreview.css";

// Compact preview of a post — used in feeds and on the profile page's post grid.
// `post.author` is a populated user object from the API.
function PostPreview({ post, favourite = false }) {
  const author = post.author || {};

  return (
    <Link to={`/post/${post._id}`} className="post-preview card">
      <img src={post.image} alt={post.description} className="post-preview__image" />
      <div className="post-preview__body">
        <div className="post-preview__meta">
          <span className="post-preview__author">
            {author.displayName} <span className="muted">@{author.username}</span>
          </span>
          {favourite && <span className="post-preview__favourite">★ favourite</span>}
        </div>
        <p className="post-preview__title">{post.description}</p>
        <div className="post-preview__tags">
          {(post.hashtags || []).map((tag) => (
            <span key={tag} className="tag">
              #{tag}{" "}
            </span>
          ))}
        </div>
        <div className="post-preview__stats muted">
          {(post.comments || []).length} comments · {(post.likes || []).length} likes
        </div>
      </div>
    </Link>
  );
}

export default PostPreview;
