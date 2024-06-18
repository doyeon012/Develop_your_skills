import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PostForm = ({ onPostCreated }) => {
  const [title, setTitle] = useState(''); // 제목 상태 변수를 초기화합니다.
  const [content, setContent] = useState(''); // 내용 상태 변수를 초기화합니다.
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null); // 파일 상태 변수를 추가합니다.
  const navigate = useNavigate(); // useNavigate 훅 사용

  // 폼 제출 처리 함수
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(); // FormData 객체를 생성합니다.
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('username', localStorage.getItem('username')); // 사용자 이름을 FormData 객체에 추가.
    
    if (file) {
      formData.append('file', file); // 파일을 FormData 객체에 추가합니다.
    }

    try {

      // 게시물 생성 요청을 서버에 보냅니다.
      const response = await axios.post('http://localhost:3001/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.status === 201) {
        alert('Post created successfully'); // 성공 메시지 표시
        navigate('/'); // 홈 페이지로 이동

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
        onChange={(e) => setFile(e.target.files[0])} // 파일 선택 시 파일 상태를 업데이트합니다.
      />

      <button type="submit">Create Post</button>
    </form>
  );
};

export default PostForm;
