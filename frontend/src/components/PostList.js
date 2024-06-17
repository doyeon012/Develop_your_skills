import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PostList = () => {
  const [posts, setPosts] = useState([]); // 게시글 상태를 관리하는 상태 변수를 초기화.

   // 컴포넌트가 마운트될 때 실행되는 효과 훅입니다.
   useEffect(() => {
    axios.get('http://localhost:3001/posts')
      .then(response => {
        console.log('Fetched Posts:', response.data);
        setPosts(response.data);
      })
      .catch(error => console.error('Error fetching posts:', error));
  }, []);

  // 카테고리별로 그룹화된 게시물을 생성
  const groupedPosts = posts.reduce((acc, post) => {
    if (!acc[post.category]) {
      acc[post.category] = [];
    }
    acc[post.category].push(post);
    return acc;
  }, {});

  return (
    <div>
      <h2>Posts</h2>
      {Object.keys(groupedPosts).map((category) => (
        <div key={category}>
          <h3>{category}</h3>
          <ul>
            {groupedPosts[category].map(post => (
              <li key={post.id}>
                <Link to={`/posts/${post.id}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PostList;
