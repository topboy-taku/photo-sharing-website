import { Link } from "react-router-dom";
import "./AlbumPreview.css";

function AlbumPreview({ album }) {
  return (
    <Link to={`/album/${album._id}`} className="album-preview card">
      {album.coverImage ? (
     <img src={album.coverImage} alt={album.name} className="album-preview__image" />
      ) : (
        <div className="album-preview__image album-preview__image--empty muted">No cover yet</div>
      )}
      <div className="album-preview__body">
        <p className="album-preview__title">{album.name}</p>
        <p className="muted album-preview__stats">{(album.posts || []).length} posts</p>
      </div>
    </Link>
  );
}

export default AlbumPreview;
