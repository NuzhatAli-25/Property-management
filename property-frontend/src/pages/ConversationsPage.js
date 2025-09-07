import React, { useState, useEffect } from 'react'; // This line is corrected
import { Link } from 'react-router-dom';

function ConversationsPage() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = 'http://localhost:5000';

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch(`${API_URL}/api/conversations`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setConversations(data);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, []);

    if (loading) {
        return <p>Loading conversations...</p>;
    }

    return (
        <div className="conversations-container">
            <h2>Your Messages</h2>
            <div className="conversation-list">
                {conversations.length > 0 ? (
                    conversations.map(convo => (
                        convo && convo.otherParticipant && // Added a check to prevent errors
                        <Link key={convo._id} to={`/chat/${convo.otherParticipant._id}`} className="conversation-item">
                            <div className="conversation-info">
                                <h3>{convo.otherParticipant.name}</h3>
                                {convo.lastMessage && <p>{convo.lastMessage.text}</p>}
                            </div>
                        </Link>
                    ))
                ) : (
                    <p>You have no messages.</p>
                )}
            </div>
        </div>
    );
}

export default ConversationsPage;
