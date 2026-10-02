import { useState } from "react";
import { api, getSession } from "../api/client";
import "./Profile.css";

// Contains the basic profile information block shown at the top of a profile page.
// `user` comes from GET /api/users/:id, which already encodes restriction server-side.
function Profile({ user, onEditClick, onFriendshipChanged }) {
  const [session] = useState(() => getSession());
  const isOwnProfile = session?.user?._id === user._id;
  const [busy, setBusy] = useState(false);

  // Friendship status is derived from what the viewer can see: the backend
  // only includes `friends`/requests arrays for non-restricted responses, so
  // we fall back sensibly when viewing a restricted profile.
  const viewerId = session?.user?._id;
  const isFriend = !isOwnProfile && user.friends?.some((f) => (f._id || f) === viewerId);
  const requestSentByMe = !isOwnProfile && user.friendRequestsReceived?.some((f) => (f._id || f) === viewerId);
  const requestFromThem = !isOwnProfile && user.friendRequestsSent?.some((f) => (f._id || f) === viewerId);

  const handleAction = async (action) => {
    setBusy(true);
    try {
      await action();
      onFriendshipChanged?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const renderFriendshipAction = () => {
    if (isOwnProfile) {
      return (
        <button className="btn btn-secondary" onClick={onEditClick}>
          Edit profile
        </button>
      );
    }
    if (!session) return null;
    if (isFriend) {
      return (
        <button className="btn btn-outline" disabled={busy} onClick={() => handleAction(() => api.unfriend(user._id))}>
          Friends ▾ (unfriend)
        </button>
      );
    }
    if (requestFromThem) {
      return (
        <button className="btn btn-primary" disabled={busy} onClick={() => handleAction(() => api.acceptFriendRequest(user._id))}>
          Accept friend request
        </button>
      );
    }
    if (requestSentByMe) {
      return (
        <button className="btn btn-outline" disabled={busy} onClick={() => handleAction(() => api.declineFriendRequest(user._id))}>
          Request sent (cancel)
        </button>
      );
    }
    return (
      <button className="btn btn-primary" disabled={busy} onClick={() => handleAction(() => api.sendFriendRequest(user._id))}>
        Send friend request
      </button>
    );
  };

  return (
    <div className="profile card">
      {user.profileImage ? (
        <img src={user.profileImage} alt={user.displayName} className="profile__avatar" />
      ) : (
        <div className="avatar-fallback profile__avatar">{user.displayName?.[0]?.toUpperCase()}</div>
      )}
      <div className="profile__info">
        <h2>{user.displayName}</h2>
        <p className="muted">
          @{user.username} {user.pronouns && `· ${user.pronouns}`}
        </p>

        {!user.restricted && (
          <>
            <p className="profile__bio">{user.bio}</p>
            {user.links?.length > 0 && <p className="muted profile__links">Links: {user.links.join(" · ")}</p>}
            <p className="profile__stats">
              {user.postsCount ?? 0} posts · {user.friendsCount ?? (user.friends?.length || 0)} friends
            </p>
          </>
        )}

        {user.restricted && (
          <p className="muted">Only the name and profile picture are visible until you are friends.</p>
        )}

        <div className="profile__actions">{renderFriendshipAction()}</div>
      </div>
    </div>
  );
}

export default Profile;
