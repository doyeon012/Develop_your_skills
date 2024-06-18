import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../PostList.css'; // PostList 전용 CSS 파일을 추가하여 스타일링

const PostList = () => {
  const [posts, setPosts] = useState([]); // 게시글 상태를 관리하는 상태 변수를 초기화.
  const [sortBy, setSortBy] = useState('latest'); // 정렬 옵션 상태를 관리하는 상태 변수 초기화.
  const [category, setCategory] = useState(''); // 카테고리 필터 상태를 관리하는 상태 변수 초기화.


   // 컴포넌트가 마운트될 때 실행되는 효과 훅입니다.
  useEffect(() => {
    // localStorage에서 저장된 정렬 옵션을 불러옵니다.
    const savedSortBy = localStorage.getItem('sortBy');
    if (savedSortBy) {
      setSortBy(savedSortBy);
    }

    // localStorage에서 저장된 카테고리 필터를 불러옵니다.
    const savedCategory = localStorage.getItem('category');
    if (savedCategory) {
      setCategory(savedCategory);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [sortBy, category]);


  // 게시물 데이터를 가져오는 함수
  const fetchPosts = () => {
    axios.get('http://localhost:3001/posts', {
      params: {
        sortBy,
        category,
      },
    })
      .then(response => {
        
        setPosts(response.data);
      })
      .catch(error => console.error('Error fetching posts:', error));
  };

  // 좋아요 버튼 클릭 처리 함수
  const handleLike = (postId) => {
    axios.post(`http://localhost:3001/posts/${postId}/like`)

      .then(response => {
        setPosts(posts.map(post => post.id === postId ? response.data : post));
      })
      .catch(error => console.error('Error liking post:', error));
  };


  // 정렬 옵션 변경 처리 함수
  const handleSortByChange = (e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    localStorage.setItem('sortBy', newSortBy); // localStorage에 정렬 옵션을 저장
  };

  // 카테고리 필터 변경 처리 함수
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    localStorage.setItem('category', newCategory); // localStorage에 카테고리 필터를 저장
  };

  // 카테고리별로 그룹화된 게시물을 생성
  const groupedPosts = posts.reduce((acc, post) => {
    if (!acc[post.category]) {
      acc[post.category] = [];
    }
    acc[post.category].push(post);
    return acc;
  }, {});

  return (
    <div className="post-list" >
      <h2>Posts</h2>

      <div className="filters">
        <select onChange={handleSortByChange} value={sortBy}>
          <option value="latest">Latest</option>
          <option value="likes">Most Liked</option>
          <option value="comments">Most Commented</option>
        </select>
        <input
          type="text"
          placeholder="Filter by category"
          value={category}
          onChange={handleCategoryChange}
        />
      </div>

      {Object.keys(groupedPosts).map((category) => (
        <div key={category} className="category" >
          <h3>{category}</h3>
          <ul>
            {groupedPosts[category].map(post => (
              <li key={post.id} className="post-item">

                <Link to={`/posts/${post.id}`}>{post.title}</Link>
                {post.file && <img src={`http://localhost:3001/uploads/${post.file}`} alt={post.title} />}
                <p>Likes: {post.likes}</p>

                <button onClick={() => handleLike(post.id)}>Like</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PostList;
