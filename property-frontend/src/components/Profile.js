//Profile.js
import React, { useState, useEffect } from 'react';

function Profile() {
    const [profile, setProfile] = useState({ name: '', phone: '', email: '', purchasedPropertiesDetails: [] });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const API_URL = 'http://localhost:5000';

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`${API_URL}/api/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: profile.name, phone: profile.phone })
            });
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    if (loading) return <p>Loading profile...</p>;

    return (
        <div className="profile-container">
            <h2>Your Profile</h2>
            <div className="profile-details">
                <p><strong>Email:</strong> {profile.email}</p>
                {isEditing ? (
                    <>
                        <label>Name:</label>
                        <input type="text" name="name" value={profile.name} onChange={handleInputChange} />
                        <label>Phone:</label>
                        <input type="tel" name="phone" value={profile.phone} onChange={handleInputChange} />
                        <button className="btn btn-primary" onClick={handleSave}>Save</button>
                        <button className="btn" onClick={() => setIsEditing(false)}>Cancel</button>
                    </>
                ) : (
                    <>
                        <p><strong>Name:</strong> {profile.name}</p>
                        <p><strong>Phone:</strong> {profile.phone}</p>
                        <button className="btn" onClick={() => setIsEditing(true)}>Edit</button>
                    </>
                )}
            </div>

            <hr />

            <h3>Purchased Properties</h3>
            <div className="property-list">
                {profile.purchasedPropertiesDetails && profile.purchasedPropertiesDetails.length > 0 ? (
                    profile.purchasedPropertiesDetails.map(property => (
                         <div key={property._id} className="property-card">
                            <img src={`${API_URL}/${property.image.replace(/\\/g, '/')}`} alt={property.type} />
                            <h3>{property.type} - {property.size} sqft</h3>
                            <p><strong>Location:</strong> {property.location}</p>
                         </div>
                    ))
                ) : (
                    <p>You have not purchased any properties yet.</p>
                )}
            </div>
        </div>
    );
}

export default Profile;
