import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const PostDetail = () => {
  const { id } = useParams(); // URL에서 id 파라미터를 가져오기.
  const [post, setPost] = useState(null); // 게시글 상태를 관리하는 상태 변수를 초기화.
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
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
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:3001/posts/${id}`, { title: editTitle, content: editContent });
      if (response.status === 200) {
        setPost(response.data);
        setIsEditing(false);
      } else {
        alert('Failed to update post');
      }
    } catch (error) {
      alert('Failed to update post: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeletePost  = async () => {
    try {
      const response = await axios.delete(`http://localhost:3001/posts/${id}`);
      
      if (response.status === 204) {
        navigate('/');
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      alert('Failed to delete post: ' + (error.response?.data?.message || error.message));
    }
  };


  
  // 게시글이 아직 로드되지 않은 경우 로딩 메시지를 표시.
  if (!post) return <div>Loading...</div>;

  return (
    <div>
      {isEditing ? (
        <form onSubmit={handleEditSubmit}>
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
          <button type="submit">Update Post</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleDeletePost}>Delete</button>
        </>
      )}
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
