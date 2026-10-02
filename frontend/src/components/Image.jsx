import "./Image.css";

// Displays the image for a post.
function Image({ src, alt }) {
  return (
    <div className="orbit-image">
      <img src={src} alt={alt} />
    </div>
  );
}

export default Image;
