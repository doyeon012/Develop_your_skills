import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate  } from 'react-router-dom';
import '../PostDetail.css'; // PostList 전용 CSS 파일을 추가하여 스타일링


// PostDetail 컴포넌트 정의
const PostDetail = () => {
  const { id } = useParams(); // URL에서 id 파라미터를 가져오기.
  const [post, setPost] = useState(null); // 게시글 상태를 관리하는 상태 변수를 초기화.
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

   // 컴포넌트가 마운트될 때 게시물 및 댓글 데이터를 가져오는 함수
  useEffect(() => {

    // 게시물 데이터를 가져오는 함수
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/posts/${id}`);
        setPost(response.data);

        setEditTitle(response.data.title);
        setEditContent(response.data.content);

      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };

    // 댓글 데이터를 가져오는 함수
    const fetchComments = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/posts/${id}/comments`);
        setComments(response.data);

      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchPost(); // 게시물 데이터 가져오기
    fetchComments(); // 댓글 데이터 가져오기
  }, [id]); // id가 변경될 때마다 실행

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3001/posts/${id}/comments`, { content: newComment });
      
      if (response.status === 201) {

        setComments([...comments, response.data]); // 새로운 댓글 추가
        setNewComment(''); // 입력 필드 초기화

      } else {
        alert('Failed to add comment');
      }

    } catch (error) {
      alert('Failed to add comment: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 게시물을 수정하는 함수
  const handleEditSubmit = async (e) => {

    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:3001/posts/${id}`, { title: editTitle, content: editContent });
      
      if (response.status === 200) {
        setPost(response.data); // 수정된 게시물 데이터 설정
        setIsEditing(false); // 수정 모드 종료

      } else {
        alert('Failed to update post');
      }
    } catch (error) {
      alert('Failed to update post: ' + (error.response?.data?.message || error.message));
    }
  };

  // 게시물을 삭제하는 함수
  const handleDeletePost  = async () => {

    try {
      const response = await axios.delete(`http://localhost:3001/posts/${id}`);
      
      if (response.status === 204) {
        navigate('/'); // 게시물 삭제 후 홈 페이지로 이동
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      alert('Failed to delete post: ' + (error.response?.data?.message || error.message));
    }
  };

  // 게시글이 아직 로드되지 않은 경우 로딩 메시지를 표시.
  if (!post) return <div>Loading...</div>;

  // 뒤로가기 버튼 핸들러
  const handleBack = () => {
    const sortBy = sessionStorage.getItem('sortBy') || 'latest';
    const category = sessionStorage.getItem('category') || '';
    navigate(`/?sortBy=${sortBy}&category=${category}`, { replace: true }); // 상태 전달
    window.location.reload(); // 페이지를 새로고침하여 정렬 옵션과 필터를 유지
  };

  return (
    <div className="post-detail">
      <div className="post-content">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="edit-form">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              required
            />
            <div className="edit-buttons">
              <button type="submit">Update Post</button>
              <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
            <p>by {post.username}</p>
            <div className="post-buttons">
              <button onClick={() => setIsEditing(true)}>Edit</button>
              <button onClick={handleDeletePost}>Delete</button>
            </div>
          </>
        )}
      </div>
      <hr />
      <div className="comments-section">
        <h3>Comments</h3>
        <ul className="comments-list">
          {comments.map(comment => (
            <li key={comment.id}>{comment.content}</li>
          ))}
        </ul>
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment"
            required
          />
          <button type="submit">Add Comment</button>
        </form>
      </div>
      <button onClick={handleBack} className="back-button">Back</button>
    </div>
  );
};


export default PostDetail;
