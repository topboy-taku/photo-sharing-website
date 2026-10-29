import { useState } from "react";
import ProfilePreview from "./ProfilePreview";
import { api } from "../api/client";
import "./Friend.css";

function Friend({ friends = [], requests = [], title = "Friends", onRequestHandled }) {
  const [busyId, setBusyId] = useState(null);
  const respond = async (userId, accept) => {
       setBusyId(userId);

    
    try{
      if(accept) await api.acceptFriendRequest(userId);
        else await api.declineFriendRequest(userId);
          onRequestHandled?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (requests.length > 0) {
    return (
      <div className="friend-list card">
        <h4>Friend requests</h4>
        {requests.map((req) => (
          <ProfilePreview
            key={req._id}
            user={req}
            action={
              <div className="friend-list__request-actions">
              <button className="btn btn-secondary" disabled={busyId === req._id} onClick={() => respond(req._id, true)}>
                    Accept
            </button>
             <button className="btn btn-outline" disabled={busyId === req._id} onClick={() => respond(req._id, false)}>
                ✕
            </button>
          </div>
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="friend-list card">
      <div className="friend-list__header">
        <h4>{title}</h4>
      </div>
      {friends.length === 0 && <p className="muted">No friends to show yet.</p>}
      {friends.map((friend) => (
        <ProfilePreview key={friend._id} user={friend} />
      ))}
    </div>
  );
}

export default Friend;
