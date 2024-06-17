import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const PostDetail = () => {
  const { id } = useParams(); // URL에서 id 파라미터를 가져오기.
  const [post, setPost] = useState(null); // 게시글 상태를 관리하는 상태 변수를 초기화.

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/posts/${id}`);
        setPost(response.data);
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/posts/${id}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchPost();
    fetchComments();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`http://localhost:3001/posts/${id}/comments`, { content: newComment });
      if (response.status === 201) {
        setComments([...comments, response.data]);
        setNewComment('');

      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      alert('Failed to add comment: ' + (error.response?.data?.message || error.message));
    }
  };
  


  
  // 게시글이 아직 로드되지 않은 경우 로딩 메시지를 표시.
  if (!post) return <div>Loading...</div>;

  return (
    <div>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
      <hr />
      <h3>Comments</h3>
      <ul>
        {comments.map(comment => (
          <li key={comment.id}>{comment.content}</li>
        ))}
      </ul>
      <form onSubmit={handleCommentSubmit}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment"
          required
        />
        <button type="submit">Add Comment</button>
      </form>
    </div>
  );
};

export default PostDetail;
