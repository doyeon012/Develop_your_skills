import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import '../Chat.css';

const socket = io('http://localhost:3001'); // 서버 주소로 소켓 연결

const Chat = ({ username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('chat message');
    };
  }, []);


  const sendMessage = (e) => {
    e.preventDefault();
    const msg = { username, text: message };
    socket.emit('chat message', msg);

    setMessage('');
  };

  return (
    <div className="chat-container">
      <h2>Chat</h2>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.username === username ? 'my-message' : 'other-message'}`}>
            <span className="message-username">{msg.username}: </span>
            <span className="message-text">{msg.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message..."
        />

        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
