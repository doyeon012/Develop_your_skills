import React, { useState, useEffect  } from 'react';
import { BrowserRouter as Router, Routes, Route, Link  } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import PostDetail from './components/PostDetail';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // 인증 상태를 관리하는 상태 변수

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    console.log('Auth Status on mount:', authStatus); // 로컬 스토리지 값 확인
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // 로그아웃 함수
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated'); // 로컬 스토리지에서 인증 상태 삭제
  };

   // 인증 상태가 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    console.log('Setting Auth Status:', isAuthenticated); // 상태 변경 확인
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);


  return (
    <Router>
      <div className="App">
        <nav>
          <Link to="/">Home</Link>
          {!isAuthenticated ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              <Link to="/create">Create Post</Link>
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
        </nav>
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={isAuthenticated ? <PostForm /> : <Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/posts/:id" element={<PostDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
