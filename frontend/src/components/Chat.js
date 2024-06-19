import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import '../Chat.css';

const socket = io('http://localhost:3001'); // 서버 주소로 소켓 연결

const Chat = ({ username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(''); // 방 상태 변수 추가
  const [inRoom, setInRoom] = useState(false); // 사용자가 방에 있는지 여부를 저장

  useEffect(() => {
    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('chat message');
    };
  }, []);


  const joinRoom = (e) => {
    e.preventDefault();
    if (room) {
      socket.emit('join room', room);
      setInRoom(true); // 방에 성공적으로 조인했을 때 상태 변경
    }
  };

  const leaveRoom = (e) => {
    e.preventDefault();
    if (room) {
      socket.emit('leave room', room);
      setInRoom(false); // 방을 떠났을 때 상태 변경
      setMessages([]); // 메시지 초기화
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();

    if (message.trim() !== '' && room) {
      const msg = { username, text: message, room };
      socket.emit('chat message', msg);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <h2>Chat</h2>
      {!inRoom ? (
        <form className="room-controls" onSubmit={joinRoom}>
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter room name..."
          />
          <button type="submit">Join Room</button>
        </form>
      ) : (
        <div className="room-controls">
          <span>Room: {room}</span>
          <button onClick={leaveRoom}>Leave Room</button>
        </div>
      )}
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.username === username ? 'my-message' : 'other-message'}`}>
            <span className="message-username">{msg.username}: </span>
            <span className="message-text">{msg.text}</span>
          </div>
        ))}
      </div>
      {inRoom && (
        <form onSubmit={sendMessage}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
          />
          <button type="submit">Send</button>
        </form>
      )}
    </div>
  );
};

export default Chat;
