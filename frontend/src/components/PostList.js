import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation  } from 'react-router-dom';
import '../PostList.css'; // PostList 전용 CSS 파일을 추가하여 스타일링

const PostList = () => {
  const [posts, setPosts] = useState([]); // 게시글 상태를 관리하는 상태 변수를 초기화.
  const [sortBy, setSortBy] = useState('latest'); // 정렬 옵션 상태를 관리하는 상태 변수 초기화.
  const [category, setCategory] = useState(''); // 카테고리 필터 상태를 관리하는 상태 변수 초기화.
  const navigate = useNavigate(); // useNavigate 훅 사용
  const location = useLocation();



   // 컴포넌트가 마운트될 때 실행되는 효과 훅입니다.
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const savedSortBy = queryParams.get('sortBy') || localStorage.getItem('sortBy') || 'latest';
    const savedCategory = queryParams.get('category') || localStorage.getItem('category') || '';
    
    setSortBy(savedSortBy);
    setCategory(savedCategory);

    // 상태를 localStorage에 저장
    localStorage.setItem('sortBy', savedSortBy);
    localStorage.setItem('category', savedCategory);
  }, [location.search]);

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
    updateURL(newSortBy, category);
  };

  // 카테고리 필터 변경 처리 함수
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    updateURL(sortBy, newCategory);
  };


  // URL 업데이트 함수
  const updateURL = (sortBy, category) => {
    navigate(`/?sortBy=${sortBy}&category=${category}`, { replace: true });

    // 상태를 localStorage에 저장
    localStorage.setItem('sortBy', sortBy);
    localStorage.setItem('category', category);
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

                <Link to={`/posts/${post.id}`} state={{ sortBy, category }}>{post.title}</Link>
                <p>by {post.username}</p>
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
