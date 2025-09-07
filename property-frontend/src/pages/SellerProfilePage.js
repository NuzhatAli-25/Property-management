// SellerProfilePage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import Link
import { jwtDecode } from 'jwt-decode';
import '../App.css'; 

function SellerProfilePage() {
    const { sellerId } = useParams();
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewText, setReviewText] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const API_URL = 'http://localhost:5000';

    const fetchSellerProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/seller/${sellerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setSeller(data);
        } catch (error) {
            console.error('Error fetching seller profile:', error);
        } finally {
            setLoading(false);
        }
    }, [sellerId]);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setCurrentUserId(jwtDecode(token).id);
        }
        fetchSellerProfile();
    }, [fetchSellerProfile]);

    const handlePostReview = async (e) => {
        e.preventDefault();
        if (!reviewText.trim()) return;
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`${API_URL}/api/seller/${sellerId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reviewText })
            });
            setReviewText('');
            fetchSellerProfile();
        } catch (error) {
            console.error('Error posting review:', error);
        }
    };
    
    const handleTrustClick = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`${API_URL}/api/seller/${sellerId}/trust`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchSellerProfile();
        } catch (error) {
            console.error('Error trusting seller:', error);
        }
    };

    const handleGoldenBadgeClick = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`${API_URL}/api/seller/${sellerId}/golden-badge`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchSellerProfile();
        } catch (error) {
            console.error('Error giving golden badge:', error);
        }
    };

    if (loading) return <p>Loading seller profile...</p>;
    if (!seller) return <p>Seller not found.</p>;
    
    const hasTrusted = seller.trustedBy && seller.trustedBy.includes(currentUserId);
    const hasGivenBadge = seller.goldenBadges && seller.goldenBadges.includes(currentUserId);
    const isOwnProfile = currentUserId === sellerId; // Check if it's the user's own profile

    return (
        <div className="seller-profile-container">
            <h2>Seller Profile</h2>
            <div className="seller-details">
                <p><strong>Name:</strong> {seller.name}</p>
                <p><strong>Phone:</strong> {seller.phone}</p>
            </div>
            
            <div className="seller-actions">
                {/* Conditionally render the message button */}
                {!isOwnProfile && (
                    <Link to={`/chat/${sellerId}`} className="btn btn-primary">Message</Link>
                )}
                <button onClick={handleTrustClick} disabled={hasTrusted || isOwnProfile} className="btn trust-btn">
                    {hasTrusted ? 'Trusted' : 'Trusted?'} ({seller.trustCount})
                </button>
                <button onClick={handleGoldenBadgeClick} disabled={hasGivenBadge || isOwnProfile} className="btn golden-badge-btn">
                    Golden Badge ({seller.goldenBadgeCount})
                </button>
            </div>

            <hr />

            <div className="reviews-section">
                <h3>Reviews</h3>
                {!isOwnProfile && (
                    <form onSubmit={handlePostReview} className="review-form">
                        <textarea 
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Write a review..."
                            rows="4"
                        />
                        
                        <button type="submit" className="btn btn-primary">Post Review</button>
                    </form>
                )}
                <div className="review-list">
                    {seller.reviews && seller.reviews.length > 0 ? (
                        seller.reviews.slice().reverse().map((review, index) => (
                            <div key={index} className="review-item">
                                <p><strong>{review.reviewerName}</strong> <span className="review-date">({new Date(review.date).toLocaleDateString()})</span></p>
                                <p>{review.text}</p>
                            </div>
                        ))
                    ) : (
                        <p>No reviews yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SellerProfilePage;
