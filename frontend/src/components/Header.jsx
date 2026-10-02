import { Link, useNavigate } from "react-router-dom";
import { getSession, clearSession, api } from "../api/client";
import "./Header.css";
function Header() {
  const navigate = useNavigate();
  const session = getSession();
  const handleLogOut = async () => {
    try {
      await api.logout();
    } catch {
      // logout is stateless server-side
    }
    clearSession();
    navigate("/");
  };

  return (
    <header className="orbit-header">
      <Link to="/home" className="orbit-header__logo">
        orbit<span className="orbit-header__dot">●</span>
      </Link>
      <nav className="orbit-header__nav" aria-label="Main navigation">
        <Link to="/home">Home</Link>
        <Link to="/search">Search</Link>
        {session?.user && <Link to={`/profile/${session.user._id}`}>Profile</Link>}
        <button className="orbit-header__logout" onClick={handleLogOut}>
          Log out
        </button>
      </nav>
    </header>
  );
}

export default Header;
