import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import PostDetail from './components/PostDetail';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // 인증 상태를 관리하는 상태 변수

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
            <Link to="/create">Create Post</Link>
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
