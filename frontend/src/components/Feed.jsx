import PostPreview from "./PostPreview";
import "./Feed.css";

// Displays a feed of post previews — the page decides which posts to pass in
function Feed({ posts, favouriteId = null }) {
  if (posts.length === 0) {
    return <p className="muted">Nothing here yet.</p>;
  }

  return (
    <div className="feed">
    {posts.map((post) => (
    <PostPreview key={post._id} post={post} favourite={post.author?._id === favouriteId} />
      ))}
    </div>
  );
}

export default Feed;
