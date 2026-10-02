import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setSession } from "../api/client";
import "./AuthForm.css";

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const next = {};
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    }
    if(!password) {
      next.password = "Password is required.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try{
      const res = await api.login({ email, password });
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
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          className={`input-field ${errors.email ? "input-error" : ""}`}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          className={`input-field ${errors.password ? "input-error" : ""}`}
          placeholder="••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      <button type="submit" className="btn btn-primary auth-form__submit" disabled={submitting}>
        {submitting ? "Logging in…" : "Log in"}
      </button>
      {serverError && <p className="field-error auth-form__status">{serverError}</p>}
    </form>
  );
}

export default LoginForm;
