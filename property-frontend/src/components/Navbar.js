import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ isLoggedIn, onLogout, shortlistCount }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        onLogout(); // Notify App.js to update state
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <Link to="/">Property Portal</Link>
            <div>
                {isLoggedIn ? (
                    <>
                        <Link to="/buy">Buy Property</Link>
                        <Link to="/shortlist">Shortlist ({shortlistCount})</Link>
                        <Link to="/messages">Messages</Link> {/* Added this line */}
                        <Link to="/profile">Profile</Link>
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/signup">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
