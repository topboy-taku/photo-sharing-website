import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import { getSession } from "../api/client";
import "./Splash.css";

// The only page without the Header/Navigation component.
function Splash() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("signup");

  useEffect(() => {
    if (getSession()) navigate("/home");
  }, [navigate]);

  return (
    <div className="splash">
      <nav className="splash__nav">
        <span className="splash__logo">
          orbit<span className="splash__dot">●</span>
        </span>
      </nav>

      <div className="splash__content">
        <div className="splash__hero">
          <h1>
            Capture your
            <br />
            <span className="splash__accent">universe.</span>
          </h1>
          <p className="splash__tagline">
            Orbit is where your photos, songs and playlists find their people. Post to your own
            orbit, follow friends, build albums, and let every share pull someone a little closer.
          </p>
          <div className="splash__pills">
            <span>Albums &amp; posts</span>
            <span>Friend feeds</span>
            <span>Hashtag discovery</span>
          </div>
        </div>

        <div className="splash__auth card">
          <h2>Join the orbit</h2>
          <p className="muted">Create an account or log in to continue.</p>

          <div className="splash__tabs">
            <button className={`btn ${tab === "signup" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("signup")}>
              Sign up
            </button>
            <button className={`btn ${tab === "login" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("login")}>
              Log in
            </button>
          </div>

          {tab === "signup" ? <SignupForm /> : <LoginForm />}
        </div>
      </div>
    </div>
  );
}

export default Splash;
