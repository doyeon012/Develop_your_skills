import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = ({ username }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/posts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userPosts = response.data.posts.filter(post => post.username === username);
        setPosts(userPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    fetchPosts();
  }, [username]);

  return (
    <div>
      <h1>{username.split('@')[0]}'s Profile</h1> {/* '@' 전까지의 부분만 표시 */}
      <h2>Posts</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {posts.map(post => (
          <div key={post.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <p><strong>Category:</strong> {post.category}</p>
            <p><strong>Likes:</strong> {post.likes}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
