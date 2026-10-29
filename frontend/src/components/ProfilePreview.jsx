import { Link } from "react-router-dom";
import "./ProfilePreview.css";

function ProfilePreview({ user, subtitle, action }) {
  return (
    <div className="profile-preview">
      <Link to={`/profile/${user._id}`} className="profile-preview__link">
        {user.profileImage ? (
          <img src={user.profileImage} alt={user.displayName} className="profile-preview__avatar" />
        ) : (
          <div className="avatar-fallback profile-preview__avatar">{user.displayName?.[0]?.toUpperCase()}</div>
        )}
        <div>
          <p className="profile-preview__name">{user.displayName}</p>
          <p className="profile-preview__sub muted">
            @{user.username}
            {subtitle ? ` · ${subtitle}` : ""}
          </p>
        </div>
      </Link>
      {action && <div className="profile-preview__action">{action}</div>}
    </div>
  );
}

export default ProfilePreview;
