const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Simplified session storage for Deliverable 2 — a real token scheme is out
// of scope for the "basic functionality" bar this deliverable asks for.
export function getSession() {
  try {
    const raw = localStorage.getItem("orbit_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(user, token) {
  localStorage.setItem("orbit_session", JSON.stringify({ user, token }));
}

export function clearSession() {
  localStorage.removeItem("orbit_session");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const session = getSession();
    if (session?.token) headers["x-user-id"] = session.token;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    let message = "Request failed (" + res.status + ")";
    if (data && data.message) {
      message = data.message;
    }
    throw new Error(message);
  }
  return data;
}

export const api = {
  // Auth
  signup: (payload) => request("/api/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  logout: () => request("/api/auth/logout", { method: "POST" }),

  // Users / profile
  getProfile: (id) => request(`/api/users/${id}`, { auth: true }),
  updateProfile: (id, payload) => request(`/api/users/${id}`, { method: "PUT", body: payload, auth: true }),
  deleteProfile: (id) => request(`/api/users/${id}`, { method: "DELETE", auth: true }),
  searchUsers: (q) => request(`/api/users?q=${encodeURIComponent(q)}`),
  getFriendRequests: (id) => request(`/api/users/${id}/friend-requests`, { auth: true }),
  getFriends: (id) => request(`/api/users/${id}/friends`),

  // Friends
  sendFriendRequest: (id) => request(`/api/users/${id}/friend-request`, { method: "POST", auth: true }),
  acceptFriendRequest: (id) => request(`/api/users/${id}/friend-accept`, { method: "POST", auth: true }),
  declineFriendRequest: (id) => request(`/api/users/${id}/friend-decline`, { method: "POST", auth: true }),
  unfriend: (id) => request(`/api/users/${id}/unfriend`, { method: "POST", auth: true }),

  // Posts
  getGlobalFeed: () => request("/api/activity/global"),
  getLocalFeed: (userId) => request(`/api/activity/local/${userId}`),
  getUserPosts: (userId) => request(`/api/posts/user/${userId}`, { auth: true }),
  searchPosts: (q) => request(`/api/posts/search?q=${encodeURIComponent(q)}`),
  getPost: (id) => request(`/api/posts/${id}`),
  createPost: (payload) => request("/api/posts", { method: "POST", body: payload, auth: true }),
  updatePost: (id, payload) => request(`/api/posts/${id}`, { method: "PUT", body: payload, auth: true }),
  deletePost: (id) => request(`/api/posts/${id}`, { method: "DELETE", auth: true }),
  likePost: (id) => request(`/api/posts/${id}/like`, { method: "POST", auth: true }),
  commentOnPost: (id, text) => request(`/api/posts/${id}/comment`, { method: "POST", body: { text }, auth: true }),
  reportPost: (id, reason) => request(`/api/posts/${id}/report`, { method: "POST", body: { reason }, auth: true }),
  getReportReasons: () => request("/api/admin/reasons", { auth: true }),

  // Albums
  getUserAlbums: (userId) => request(`/api/albums/user/${userId}`),
  getAlbum: (id) => request(`/api/albums/${id}`),
  searchAlbums: (q) => request(`/api/albums/search?q=${encodeURIComponent(q)}`),
  createAlbum: (payload) => request("/api/albums", { method: "POST", body: payload, auth: true }),
  updateAlbum: (id, payload) => request(`/api/albums/${id}`, { method: "PUT", body: payload, auth: true }),
  deleteAlbum: (id) => request(`/api/albums/${id}`, { method: "DELETE", auth: true }),
  addPostToAlbum: (albumId, postId) =>
    request(`/api/albums/${albumId}/posts`, { method: "POST", body: { postId }, auth: true }),
  removePostFromAlbum: (albumId, postId) =>
    request(`/api/albums/${albumId}/posts/${postId}`, { method: "DELETE", auth: true }),

  // Admin
  getReportedPosts: () => request("/api/admin/reports", { auth: true }),
  getHiddenPosts: () => request("/api/admin/hidden-posts", { auth: true }),
  setPostVisibility: (id, hidden) =>
    request(`/api/admin/posts/${id}/visibility`, { method: "PUT", body: { hidden }, auth: true }),
  getAllUsersAdmin: () => request("/api/admin/users", { auth: true }),
  getAllAlbumsAdmin: () => request("/api/admin/albums", { auth: true }),
  addReportReason: (label) => request("/api/admin/reasons", { method: "POST", body: { label }, auth: true }),
  deleteReportReason: (id) => request(`/api/admin/reasons/${id}`, { method: "DELETE", auth: true }),
};

// Reads an <input type="file"> image as a base64 data URL — this project has
// no separate file storage, so images travel as data URLs end-to-end.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
