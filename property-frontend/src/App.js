import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Dashboard from './components/Dashboard';
import AddProperty from './components/AddProperty';
import AllProperties from './components/AllProperties';
import ShortlistPage from './components/ShortlistPage';
import BiddingPage from './components/BiddingPage';
import Profile from './components/Profile';
import SellerProfilePage from './pages/SellerProfilePage';
import ChatPage from './pages/ChatPage';
import ConversationsPage from './pages/ConversationsPage'; // Import the new page
import './App.css';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('accessToken');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken'));
    const [shortlistCount, setShortlistCount] = useState(0);

    const handleAuthChange = () => {
        setIsLoggedIn(!!localStorage.getItem('accessToken'));
    };

    const updateShortlistCount = (count) => {
        setShortlistCount(count);
    };

    return (
        <Router>
            <Navbar isLoggedIn={isLoggedIn} onLogout={handleAuthChange} shortlistCount={shortlistCount} />
            <div className="container">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage onLogin={handleAuthChange} />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Protected Routes */}
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/add-property" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
                    <Route path="/buy" element={<ProtectedRoute><AllProperties updateShortlistCount={updateShortlistCount} /></ProtectedRoute>} />
                    <Route path="/shortlist" element={<ProtectedRoute><ShortlistPage updateShortlistCount={updateShortlistCount} /></ProtectedRoute>} />
                    <Route path="/bidding/:propertyId" element={<ProtectedRoute><BiddingPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/seller-profile/:sellerId" element={<ProtectedRoute><SellerProfilePage /></ProtectedRoute>} />
                    <Route path="/chat/:recipientId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} /> {/* Add new route */}
                    
                    <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
