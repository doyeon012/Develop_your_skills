import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate  } from 'react-router-dom';

const PostForm = ( ) => {
  const [title, setTitle] = useState(''); // 제목 상태 변수를 초기화.
  const [content, setContent] = useState(''); // 내용 상태 변수를 초기화.
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null); // 파일 상태 변수를 추가.
  const navigate = useNavigate(); // useNavigate 훅 사용


  // 폼 제출 처리 함수
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(); // FormData 객체를 생성.
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('username', sessionStorage.getItem('username')); // 사용자 이름을 FormData 객체에 추가.
    
    if (file) {
      formData.append('file', file); // 파일을 FormData 객체에 추가.
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to create a post.');
        navigate('/login');
        return;
      }

      // 게시물 생성 요청을 서버에 보냄.
      const response = await axios.post('http://localhost:3001/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 201) {
        alert('Post created successfully'); // 성공 메시지 표시

        const sortBy = sessionStorage.getItem('sortBy') || 'latest';
        const category = sessionStorage.getItem('category') || '';

        navigate(`/?sortBy=${sortBy}&category=${category}`, { replace: true });
        window.location.reload(); // 페이지를 새로고침하여 정렬 옵션과 필터를 유지
      } else {
        alert('Failed to create post'); // 실패 메시지 표시
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

      <input
        type="file"
        accept="image/*" // 이미지 파일만 선택할 수 있도록 제한
        onChange={(e) => setFile(e.target.files[0])} // 파일 선택 시 파일 상태를 업데이트합니다.
      />

      <button type="submit">Create Post</button>
    </form>
  );
};

export default PostForm;
