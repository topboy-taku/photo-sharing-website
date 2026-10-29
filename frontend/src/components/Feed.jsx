import PostPreview from "./PostPreview";
import AlbumPreview from "./AlbumPreview";
import "./Feed.css";

function Feed({ posts, favouriteId = null }){
  if (posts.length === 0){
    return <p className="muted">Nothing here yet.</p>;
  }

  return (
    <div className="feed">
      {posts.map((item) =>
        item.itemType === "album" ? (
          <AlbumPreview key={`album-${item._id}`} album={item} />
        ) : (
          <PostPreview key={`post-${item._id}`} post={item} favourite={item.author?._id === favouriteId} />
        )
      )}
    </div>
  );
}

export default Feed;
