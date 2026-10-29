import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setSession } from "../api/client";
import "./AuthForm.css";

// Contains all the inputs required to sign up. Validates client-side, then
// calls the real /api/auth/signup endpoint and stores the session.
function SignupForm() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const next = {};
    if (!displayName.trim()) next.displayName = "Display name is required.";
    if (!username.trim()) {
      next.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      next.username = "Username can only contain letters, numbers, dots and underscores.";
    }
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    }
    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    if (confirmPassword !== password) next.confirmPassword = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if(!validate()) return;
    setSubmitting(true);
    try{
      const res = await api.signup({ displayName, username, email, password });
      setSession(res.user, res.token);
      navigate("/home");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="signup-name">Display name</label>
        <input
          id="signup-name"
          type="text"
          className={`input-field ${errors.displayName ? "input-error" : ""}`}
          placeholder="Takunda Mugwagwa"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        {errors.displayName && <p className="field-error">{errors.displayName}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="signup-username">Username</label>
        <input
          id="signup-username"
          type="text"
          className={`input-field ${errors.username ? "input-error" : ""}`}
          placeholder="takunda"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {errors.username && <p className="field-error">{errors.username}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="signup-email">Email address</label>
        <input
          id="signup-email"
          type="email"
          className={`input-field ${errors.email ? "input-error" : ""}`}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          className={`input-field ${errors.password ? "input-error" : ""}`}
          placeholder="••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="signup-confirm">Confirm password</label>
        <input
          id="signup-confirm"
          type="password"
          className={`input-field ${errors.confirmPassword ? "input-error" : ""}`}
          placeholder="••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
      </div>

      <button type="submit" className="btn btn-primary auth-form__submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create my orbit"}
      </button>
      {serverError && <p className="field-error auth-form__status">{serverError}</p>}
    </form>
  );
}

export default SignupForm;
