// ChatPage.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import '../App.css'; // Assuming you'll add chat styles here

function ChatPage() {
    const { recipientId } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [recipient, setRecipient] = useState(null);
    const messagesEndRef = useRef(null);
    const API_URL = 'http://localhost:5000';

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            const decoded = jwtDecode(token);
            setCurrentUser({ id: decoded.id });

            // Fetch recipient info
            const fetchRecipient = async () => {
                const response = await fetch(`${API_URL}/api/seller/${recipientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setRecipient(data);
            };
            fetchRecipient();
            
            // Fetch chat history
            const fetchHistory = async () => {
                 const response = await fetch(`${API_URL}/api/chat/${recipientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setMessages(data);
            };
            fetchHistory();
        }

        const newSocket = io(API_URL);
        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, [recipientId]);

    useEffect(() => {
        if (socket && currentUser) {
            socket.emit('add_user', currentUser.id);

            socket.on('receive_message', (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
            });
        }
    }, [socket, currentUser]);
    
    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const messageData = {
            senderId: currentUser.id,
            receiverId: recipientId,
            text: newMessage,
        };
        
        const optimisticMessage = {
             sender: currentUser.id,
             text: newMessage,
             timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    if (!recipient) return <p>Loading chat...</p>;

    return (
        <div className="chat-container">
            <h2 className="chat-header">Chat with {recipient.name}</h2>
            <div className="messages-area">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-bubble ${msg.sender.toString() === currentUser.id ? 'sent' : 'received'}`}>
                        <p>{msg.text}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default ChatPage;
