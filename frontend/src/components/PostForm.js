import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PostForm = ({ onPostCreated }) => {
  const [title, setTitle] = useState(''); // 제목 상태 변수를 초기화합니다.
  const [content, setContent] = useState(''); // 내용 상태 변수를 초기화합니다.

  const navigate = useNavigate(); // useNavigate 훅 사용

  // 폼 제출 처리 함수
  const handleSubmit = async (e) => {

    e.preventDefault();
    try {
      // 서버에 새로운 게시글을 생성하는 요청을 보냅니다.
      const response = await axios.post('http://localhost:3001/posts', { title, content });
      
      if (response.status === 201) {
        alert('Post created successfully'); // 게시글 생성 성공 시 알림 메시지
        if (onPostCreated) {
          onPostCreated(response.data); // 새로운 게시물이 생성된 후 콜백 호출
        }
        navigate('/'); // 게시물 생성 후 홈 페이지로 이동
        

      } else {
        alert('Failed to create post'); // 다른 상태 코드일 경우 실패 메시지
      }
    } catch (error) {
      alert('Failed to create post: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Post</h2>
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
      <button type="submit">Create</button>
    </form>
  );
};

export default PostForm;
