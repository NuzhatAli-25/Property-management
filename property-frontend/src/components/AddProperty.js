//AddProperty.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function AddProperty() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        ownerName: '', type: 'Flat', purpose: 'Sell', location: '',
        size: '', price: '', previousPrice: '', vatRate: '',
        description: '', phone: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const API_URL = 'http://localhost:5000';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile) {
            alert('Please select an image file (.jpg or .jpeg).');
            return;
        }

        const submissionData = new FormData();
        Object.keys(formData).forEach(key => {
            submissionData.append(key, formData[key]);
        });
        submissionData.append('image', imageFile);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/upload-property`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: submissionData,
            });

            if (response.ok) {
                alert('Property added successfully!');
                navigate('/buy');
            } else {
                const errorText = await response.text();
                alert(`Failed to add property: ${errorText}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred. Please check the console.');
        }
    };

    return (
        <div>
            <h2>Add New Property</h2>
            <form onSubmit={handleSubmit} className="form-container">
                <input type="text" name="ownerName" placeholder="Owner Name" value={formData.ownerName} onChange={handleInputChange} required />
                <select name="type" value={formData.type} onChange={handleInputChange}>
                    <option value="Flat">Flat</option>
                    <option value="Plot">Plot</option>
                    <option value="Shop">Shop</option>
                </select>
                <select name="purpose" value={formData.purpose} onChange={handleInputChange}>
                    <option value="Sell">For Sell</option>
                    <option value="Rent">For Rent</option>
                    <option value="Lease">For Lease</option>
                </select>
                <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleInputChange} required />
                <input type="number" name="size" placeholder="Size (in square feet)" value={formData.size} onChange={handleInputChange} required />
                <input type="number" name="price" placeholder="Price (in BDT)" value={formData.price} onChange={handleInputChange} required />
                <input type="number" name="previousPrice" placeholder="Previous Price (in BDT)" value={formData.previousPrice} onChange={handleInputChange} required />
                <input type="number" name="vatRate" placeholder="VAT Rate (%)" value={formData.vatRate} onChange={handleInputChange} required />
                <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} required rows="4"></textarea>
                <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} required />
                <input type="file" name="image" onChange={handleFileChange} accept="image/jpeg, image/jpg" required />
                <button type="submit" className="btn btn-primary">Add Property</button>
            </form>
        </div>
    );
}

export default AddProperty;
