// Bidding.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function BiddingPage() {
    const { propertyId } = useParams();
    const [property, setProperty] = useState(null);
    const [bidPrice, setBidPrice] = useState('');
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [accountNumber, setAccountNumber] = useState('');
    const navigate = useNavigate();
    const API_URL = 'http://localhost:5000';

    const fetchProperty = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/property/${propertyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setProperty(data);
            const decodedToken = jwtDecode(token);
            setUserId(decodedToken.id);
        } catch (error) {
            console.error('Error fetching property:', error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchProperty();
    }, [propertyId]);

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`${API_URL}/api/property/${propertyId}/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ price: bidPrice })
            });
            setBidPrice('');
            fetchProperty(); 
        } catch (error) {
            console.error('Error placing bid:', error);
        }
    };

    const handleAcceptBid = async (bid) => {
        if (window.confirm("Are you sure you want to accept this bid? This cannot be undone.")) {
            try {
                const token = localStorage.getItem('accessToken');
                await fetch(`${API_URL}/api/property/${propertyId}/accept-bid`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ bidUserId: bid.userId, bidPrice: bid.price })
                });
                alert('Bid accepted! The winner will be notified to make the payment.');
                fetchProperty();
            } catch (error) {
                console.error('Error accepting bid:', error);
            }
        }
    };
    
    const handlePayment = async () => {
        if (!accountNumber) {
            alert('Please provide an account number.');
            return;
        }
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/purchase/${propertyId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountNumber }) 
            });
            if (response.ok) {
                alert('Payment successful!');
                navigate('/profile');
            } else {
                alert('Payment failed.');
            }
        } catch(err) {
            console.error(err);
        }
    };

    if (loading) return <p>Loading bidding details...</p>;
    if (!property) return <p>Property not found.</p>;

    const isOwner = property.ownerId === userId;
    const isWinningBidder = property.winningBidder === userId;
    const sortedBids = property.bids ? [...property.bids].sort((a, b) => b.price - a.price) : [];
    const highestBid = sortedBids[0];
    
    return (
        <div>
            <h2>Bidding for {property.type} at {property.location}</h2>

            {isWinningBidder && property.status === 'pending' ? (
                <div className="payment-section">
                    <h3>Congratulations! Your bid was accepted.</h3>
                    <p>Winning Price: <strong>{property.winningPrice.toFixed(2)} BDT</strong></p>
                    <p>Please complete the payment to own the property.</p>
                    <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Enter Account Number" />
                    <button className="btn btn-primary" onClick={handlePayment}>Pay Now</button>
                </div>
            ) : (
                <>
                    <div className="bidding-list">
                        <h3>Bidding Price List</h3>
                        {sortedBids.length > 0 ? (
                            <ul>
                                {sortedBids.map((bid, index) => (
                                    <li key={index} className={highestBid.userId === bid.userId ? 'highest-bid' : ''}>
                                        <span>{bid.userName}: <strong>{bid.price.toFixed(2)} BDT</strong></span>
                                        {isOwner && !property.winningBidder && index === 0 && (
                                            <button className="btn btn-sm btn-success" onClick={() => handleAcceptBid(bid)}>Accept</button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No bids placed yet.</p>
                        )}
                    </div>
                    
                    {!isOwner && !property.winningBidder && (
                        <form onSubmit={handleBidSubmit} className="bid-form">
                            <h3>Place Your Bid</h3>
                            <input
                                type="number"
                                placeholder="Your Price"
                                value={bidPrice}
                                onChange={(e) => setBidPrice(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn btn-primary">OK</button>
                        </form>
                    )}

                    {property.winningBidder && (
                        <p className="status-message success">
                            A winning bid has been selected. Waiting for payment.
                        </p>
                    )}
                     {property.status === 'sold' && (
                        <p className="status-message error">
                           This property has been sold.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

export default BiddingPage;
