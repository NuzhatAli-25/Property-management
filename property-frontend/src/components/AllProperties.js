// AllProperties.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import { debounce } from 'lodash';

function AllProperties({ updateShortlistCount }) {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '', location: '', purpose: '' });
    const API_URL = 'http://localhost:5000';

    const fetchProperties = useCallback(async (currentFilters) => {
        setLoading(true);
        try {
            const query = new URLSearchParams(currentFilters).toString();
            const response = await fetch(`${API_URL}/all-property?${query}`);
            const data = await response.json();
            setProperties(data);
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedFetch = useCallback(debounce((nextFilters) => fetchProperties(nextFilters), 500), [fetchProperties]);

    const fetchShortlist = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            const response = await fetch(`${API_URL}/api/shortlist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            updateShortlistCount(data.length);
        } catch (error) {
            console.error('Error fetching shortlist:', error);
        }
    }, [updateShortlistCount]);

    useEffect(() => {
        debouncedFetch(filters);
        fetchShortlist();
    }, [filters, debouncedFetch, fetchShortlist]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleAddToShortlist = async (propertyId) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/shortlist/${propertyId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                alert('Property added to shortlist!');
                fetchShortlist();
            } else {
                alert('Failed to add to shortlist.');
            }
        } catch (error) {
            console.error('Error adding to shortlist:', error);
        }
    };

    if (loading) return <p>Loading properties...</p>;

    return (
        <div>
            <h2>All Properties</h2>
            <div className="filter-container">
                <input type="text" name="type" placeholder="Type (Flat, Plot...)" value={filters.type} onChange={handleFilterChange} />
                <input type="text" name="location" placeholder="Location" value={filters.location} onChange={handleFilterChange} />
                <input type="text" name="purpose" placeholder="Purpose (Sell, Rent...)" value={filters.purpose} onChange={handleFilterChange} />
            </div>

            {properties.length === 0 ? (
                <p>No properties available matching your criteria.</p>
            ) : (
                <div className="property-list">
                    {properties.map(property => (
                        <div key={property._id} className="property-card">
                            <img src={`${API_URL}/${property.image.replace(/\\/g, '/')}`} alt={`${property.type}`} />
                            <h3>{property.type} - {property.size} sqft</h3>
                            <p><strong>Owner:</strong> {property.ownerName}</p>
                            <p><strong>Purpose:</strong> {property.purpose}</p>
                            <p><strong>Location:</strong> {property.location}</p>
                            <p><strong>Description:</strong> {property.description}</p>
                            <p><strong>Phone:</strong> {property.phone}</p>
                            <hr />
                            <p><strong>Price:</strong> {parseFloat(property.price).toFixed(2)} BDT</p>
                            <p><strong>Price with VAT:</strong> {property.priceWithVat} BDT</p>
                            <p><strong>Price Change:</strong> {property.priceChange}</p>
                            <div className="card-buttons">
                                <Link to={`/bidding/${property._id}`} className="btn btn-secondary">Bidding</Link>
                                <Link to={`/seller-profile/${property.ownerId}`} className="btn btn-info">Seller Profile</Link>
                                <button className="btn add-to-cart-btn" onClick={() => handleAddToShortlist(property._id)}>+</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AllProperties;


