//Dashboard 
import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
    return (
        <div style={{ textAlign: 'center', marginTop: '10rem' }}>
            <h1>Welcome to the Property Portal</h1>
            <p>What would you like to do?</p>
            <div style={{ marginTop: '2rem' }}>
                <Link to="/buy" className="btn btn-secondary" style={{ marginRight: '1rem' }}>
                    Buy a Property
                </Link>
                <Link to="/add-property" className="btn btn-primary">
                    Add New Property
                </Link>
            </div>
        </div>
    );
}

export default Dashboard;
