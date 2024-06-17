import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PostForm = ({ onPostCreated }) => {
  const [title, setTitle] = useState(''); // 제목 상태 변수를 초기화합니다.
  const [content, setContent] = useState(''); // 내용 상태 변수를 초기화합니다.
  const [category, setCategory] = useState('');
  const navigate = useNavigate(); // useNavigate 훅 사용

  // 폼 제출 처리 함수
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/posts', { title, content, category });
      if (response.status === 201) {
        alert('Post created successfully');
        navigate('/');
      } else {
        alert('Failed to create post');
      }
    } catch (error) {
      alert('Failed to create post: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      />
      <button type="submit">Create Post</button>
    </form>
  );
};

export default PostForm;
