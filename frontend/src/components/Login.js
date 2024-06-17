import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setIsAuthenticated }) => {

   // 상태 변수 설정
  const [username, setUsername] = useState(''); // 사용자 이름 상태 변수
  const [password, setPassword] = useState(''); // 비밀번호 상태 변수

  const handleSubmit = async (e) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지

    try {
      const response = await axios.post('http://localhost:3001/login', { username, password });
      
      if (response.status === 200) {
        setIsAuthenticated(true); // 로그인 성공 시 인증 상태 변경
      }
    } catch (error) {
      alert('Login failed: ' + error.response.data.message); // 로그인 실패 시 경고 메시지
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
