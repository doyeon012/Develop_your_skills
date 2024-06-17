import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const PostDetail = () => {
  const { id } = useParams(); // URL에서 id 파라미터를 가져오기.
  const [post, setPost] = useState(null); // 게시글 상태를 관리하는 상태 변수를 초기화.

  useEffect(() => {
    // 서버에서 특정 ID의 게시글을 가져옵니다.
    axios.get(`http://localhost:3001/posts/${id}`)

      .then(response => setPost(response.data)) // 성공 시 게시글 데이터를 상태에 저장.
      .catch(error => console.error('Error fetching post:', error)); // 실패 시 에러를 콘솔에 출력.
  }, [id]); // id가 변경될 때마다 이 효과 훅이 실행

  // 게시글이 아직 로드되지 않은 경우 로딩 메시지를 표시.
  if (!post) return <div>Loading...</div>;

  return (
    <div>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
    </div>
  );
};

export default PostDetail;
