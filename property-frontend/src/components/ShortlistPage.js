//ShortlistPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PaymentModal({ property, onClose, onPaymentSuccess }) {
    const [accountNumber, setAccountNumber] = useState('');
    const API_URL = 'http://localhost:5000';

    const handlePay = async () => {
        if (!accountNumber) {
            alert('Please enter an account number.');
            return;
        }
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/purchase/${property._id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountNumber }) // You can send account number if needed by backend
            });

            if (response.ok) {
                alert('Payment successful! Property has been purchased.');
                onPaymentSuccess();
            } else {
                alert('Payment failed.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('An error occurred during payment.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Payment for {property.type}</h3>
                <p>Price: {property.priceWithVat} BDT</p>
                <input type="text" placeholder="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                <button className="btn btn-primary" onClick={handlePay}>Pay</button>
                <button className="btn" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
}

function ShortlistPage({ updateShortlistCount }) {
    const [shortlistedItems, setShortlistedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const navigate = useNavigate();
    const API_URL = 'http://localhost:5000';

    const fetchShortlist = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/shortlist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setShortlistedItems(data);
            updateShortlistCount(data.length);
        } catch (error) {
            console.error('Error fetching shortlist:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShortlist();
    }, []);
    
    const handlePaymentSuccess = () => {
        setSelectedProperty(null); // Close modal
        fetchShortlist(); // Refresh list
        navigate('/profile'); // Redirect to profile to see purchased property
    };

    if (loading) return <p>Loading shortlist...</p>;

    return (
        <div>
            <h2>Your Shortlist</h2>
            {selectedProperty && (
                <PaymentModal 
                    property={selectedProperty} 
                    onClose={() => setSelectedProperty(null)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
            {shortlistedItems.length === 0 ? (
                <p>Your shortlist is empty.</p>
            ) : (
                <div className="property-list">
                    {shortlistedItems.map(property => (
                        <div key={property._id} className="property-card">
                            <img src={`${API_URL}/${property.image.replace(/\\/g, '/')}`} alt={property.type} />
                            <h3>{property.type} - {property.size} sqft</h3>
                            <p><strong>Location:</strong> {property.location}</p>
                            <p><strong>Price with VAT:</strong> {property.priceWithVat} BDT</p>
                            <button className="btn btn-primary" onClick={() => setSelectedProperty(property)}>Payment</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ShortlistPage;
