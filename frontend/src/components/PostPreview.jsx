import { Link } from "react-router-dom";
import HashtagList from "./HashtagList";
import "./PostPreview.css";

function PostPreview({ post, favourite = false }){
  const author = post.author || {};

  return(
    <Link to={`/post/${post._id}`} className="post-preview card">
      <img src={post.image} alt={post.description} className="post-preview__image" />
      <div className="post-preview__body">
        <div className="post-preview__meta">
          <span className="post-preview__author">
         {author.displayName} <span className="muted">@{author.username}</span>
          </span>
          {favourite && <span className="post-preview__favourite">★ favourite</span>}
          {post.hidden && <span className="post-preview__hidden-badge">Hidden (reported)</span>}
        </div>
        <p className="post-preview__title">{post.description}</p>
        <div className="post-preview__tags">
          <HashtagList tags={post.hashtags} />
        </div>
        <div className="post-preview__stats muted">
          {(post.comments || []).length} comments · {(post.likes || []).length} likes
        </div>
      </div>
    </Link>
  );
}

export default PostPreview;
