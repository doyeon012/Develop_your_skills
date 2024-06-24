import React, { useEffect, useState, useRef, useCallback  } from 'react';
import io from 'socket.io-client';
import '../Chat.css';

const socket = io('http://localhost:3001'); // 서버 주소로 소켓 연결

const Chat = ({ username}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(''); // 방 상태 변수 추가
  const [inRoom, setInRoom] = useState(false); // 사용자가 방에 있는지 여부를 저장
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState(''); // 새로운 방 이름 상태 변수 추가
  const [leader, setLeader] = useState(''); // 방장 상태 변수 추가

  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  const messagesEndRef = useRef(null);



  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStream = useRef(null);
  const peerConnection = useRef(null);

  const mediaRecorder = useRef(null); // 미디어 레코더

  useEffect(() => {

    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('room list', (rooms) => {
        setRooms(rooms);    
      });
    
    socket.on('update leader', ({ room: updatedRoom, leader }) => {

        if (updatedRoom === room) {
            setLeader(leader);
        }

      });

      // WebRTC 신호 교환 처리
      socket.on('offer', async (data) => {
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));

          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit('answer', { answer, room: data.room });
        }
      });

      socket.on('answer', async (data) => {
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      socket.on('ice-candidate', async (data) => {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

    return () => {
      socket.off('chat message');
      socket.off('room list');
      socket.off('update leader');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const joinRoom = (e) => {
    e.preventDefault();

    if (room) {
      socket.emit('join room', { room, username });
      setInRoom(true); // 방에 성공적으로 조인했을 때 상태 변경
    }
  };
  
  const joinSpecificRoom = (roomName) => {
    setRoom(roomName);
    socket.emit('join room', { room: roomName, username });
    setInRoom(true);
  };

  const leaveRoom = (e) => {
    e.preventDefault();

    if (room) {
      socket.emit('leave room', room);
      setInRoom(false); // 방을 떠났을 때 상태 변경
      setMessages([]); // 메시지 초기화
      setRoom(''); // 현재 방 초기화
      setLeader(''); // 방장 정보 초기화

      stopLocalStream();
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
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

  const createRoom = (e) => {
    e.preventDefault();

    if (newRoom) {
      socket.emit('create room', { room: newRoom, username });
      joinSpecificRoom(newRoom); // 방을 생성한 후 자동으로 입장하도록 수정
      setNewRoom('');
    }
  };

  const displayUsername = (username) => {
    return username.split('@')[0];
  };


  /* 로컬 스트림을  시작하고 정지하는 함수들 */
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices.', error);
    }
  };

  const stopLocalStream = () => {

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());

      localStream.current = null;
    }
  };

  // useCallback 을 사용하여 초기화되고 useEffect 훅에서 호출됌.
  const initializePeerConnection = useCallback(() => {
    peerConnection.current = new RTCPeerConnection();

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, room });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });
    }
  }, [room]);

  // 방에 참가할 때 로컬 스트림 and 피어 연결 초기화
  useEffect(() => {
    if (inRoom) {
      startLocalStream();
      initializePeerConnection();
    }
  }, [inRoom, initializePeerConnection]);

  const startRecording = () => {
    if (localStream.current) {
      mediaRecorder.current = new MediaRecorder(localStream.current, {
        mimeType: 'video/webm; codecs=vp9',
      });
      mediaRecorder.current.ondataavailable = handleDataAvailable;
      mediaRecorder.current.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  };

  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      setRecordedChunks((prev) => [...prev, event.data]);
    }
  };

  const downloadRecording = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'recording.webm';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };



  return (
    <div className="chat-container">
      <h2>Chat</h2>
      <div className="sidebar">
        <h3>Available Rooms</h3>
        <ul>
          {rooms.map((room, index) => (
            <li key={index} className="room-item">
              {room}
              <button onClick={() => joinSpecificRoom(room)}>Join Room</button>
            </li>
          ))}
        </ul>
        {!inRoom && (
          <div>
            <form className="room-controls" onSubmit={createRoom}>
              <input
                type="text"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                placeholder="Create new room..."
              />
              <button type="submit">Create Room</button>
            </form>
            <form className="room-controls" onSubmit={joinRoom}>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Enter room name..."
              />
              <button type="submit">Join Room</button>
            </form>
          </div>
        )}
      </div>
      <div className="main-content">
        {inRoom && (
          <>
            <div className="room-info">
              <div className="room-name">
                <strong>Room:</strong> {room}
              </div>
              <div className="room-leader">
                <strong>Leader:</strong> {leader === socket.id ? 'You' : displayUsername(leader)}
              </div>
              <button onClick={leaveRoom}>Leave Room</button>
            </div>
            <div className="video-container">
              <video ref={localVideoRef} autoPlay muted className="local-video" />
              <video ref={remoteVideoRef} autoPlay className="remote-video" />
            </div>
            <div className="recording-controls">
              {recording ? (
                <button onClick={stopRecording}>Stop Recording</button>
              ) : (
                <button onClick={startRecording}>Start Recording</button>
              )}
              <button onClick={downloadRecording} disabled={recordedChunks.length === 0}>
                Download Recording
              </button>
            </div>
          </>
        )}

        <div className="chat-area">
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.username === username ? 'my-message' : 'other-message'}`}>
                <span className="message-username">{displayUsername(msg.username)}: </span>
                <span className="message-text">{msg.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {inRoom && (
            <form className="message-form" onSubmit={sendMessage}>
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
      </div>
    </div>
  );
};

export default Chat;
