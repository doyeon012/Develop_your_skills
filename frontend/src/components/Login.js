import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // useNavigate 훅을 import

const Login = ({ setIsAuthenticated }) => {

   // 상태 변수 설정
  const [username, setUsername] = useState(''); // 사용자 이름 상태 변수
  const [password, setPassword] = useState(''); // 비밀번호 상태 변수
  const navigate = useNavigate(); // useNavigate 훅 사용

    // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    
    e.preventDefault(); // 폼의 기본 제출 동작 방지

    try {
      const response = await axios.post('http://localhost:3001/login', { username, password });
      
      if (response.status === 200) {

        setIsAuthenticated(true); // 인증 상태 업데이트

        const displayName = username.split('@')[0]; // '@' 전까지의 부분만 저장
        localStorage.setItem('isAuthenticated', 'true'); // 로컬 스토리지에 인증 상태 저장
        localStorage.setItem('username', displayName); // 사용자 이름을 로컬 스토리지에 저장

        alert(response.data.message); // 로그인 성공 메시지 표시
        navigate('/'); // 로그인 성공 후 홈 화면으로 이동

      } else {
        alert('Login failed'); // 로그인 실패 메시지 표시
      }
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
