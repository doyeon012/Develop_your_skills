import React, { useEffect, useState, useCallback  } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation  } from 'react-router-dom';
import '../PostList.css'; // PostList 전용 CSS 파일을 추가하여 스타일링

const PostList = () => {
  const [posts, setPosts] = useState([]); // 게시글 상태를 관리하는 상태 변수를 초기화.
  const [sortBy, setSortBy] = useState('latest'); // 정렬 옵션 상태를 관리하는 상태 변수 초기화.
  const [category, setCategory] = useState(''); // 카테고리 필터 상태를 관리하는 상태 변수 초기화.
  
  const [search, setSearch] = useState(''); // 검색어 상태를 관리하는 상태 변수 초기화.
  const [searchInput, setSearchInput] = useState(''); // 검색 입력 필드 상태를 관리하는 상태 변수 초기화.

  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 상태 변수 초기화.
  const [totalPages, setTotalPages] = useState(1); // 총 페이지 수 상태 변수 초기화.

  const navigate = useNavigate(); // useNavigate 훅 사용
  const location = useLocation();
  

  // 게시물 데이터를 가져오는 함수
  const fetchPosts = useCallback(() => {
    axios.get('http://localhost:3001/posts', {
      params: {
        sortBy,
        category,
        search,
        page: currentPage,
        limit: 10
      },
    })
      .then(response => {
        setPosts(response.data.posts);
        setTotalPages(response.data.totalPages);
      })
      .catch(error => console.error('Error fetching posts:', error));
  }, [sortBy, category, search, currentPage]);


   // 컴포넌트가 마운트될 때 실행되는 효과 훅입니다.
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const savedSortBy = queryParams.get('sortBy') || sessionStorage.getItem('sortBy') || 'latest';
    const savedCategory = queryParams.get('category') || sessionStorage.getItem('category') || '';
    const savedSearch = queryParams.get('search') || '';
    const savedPage = queryParams.get('page') || 1;

    setSortBy(savedSortBy);
    setCategory(savedCategory);
    setSearch(savedSearch);
    setSearchInput(savedSearch);
    setCurrentPage(parseInt(savedPage));

    // 상태를 sessionStorage에 저장
    sessionStorage.setItem('sortBy', savedSortBy);
    sessionStorage.setItem('category', savedCategory);
    sessionStorage.setItem('search', savedSearch);
    sessionStorage.setItem('page', savedPage);
  }, [location.search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);


  useEffect(() => {
    window.scrollTo(0, 0); // 페이지가 변경될 때 스크롤을 맨 위로 이동
  }, [currentPage]);

  // 좋아요 버튼 클릭 처리 함수
  const handleLike = (postId) => {
    axios.post(`http://localhost:3001/posts/${postId}/like`)

      .then(response => {
        setPosts(posts.map(post => post._id  === postId ? response.data : post));
      })
      .catch(error => console.error('Error liking post:', error));
  };


  // 검색어 입력 필드 변경 처리 함수
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  // 검색 실행 함수
  const executeSearch = () => {
    setSearch(searchInput);
    updateURL(sortBy, category, searchInput);
  };

  // 검색어 변경 처리 함수
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  // 정렬 옵션 변경 처리 함수
  const handleSortByChange = (e) => {
    const newSortBy = e.target.value;

    setSortBy(newSortBy);
    updateURL(newSortBy, category, search, 1);
  };

  // 카테고리 필터 변경 처리 함수
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;

    setCategory(newCategory);
    updateURL(sortBy, newCategory, search, 1);
  };

  // 페이지 변경 처리 함수
  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateURL(sortBy, category, search, page);
  };


  // URL 업데이트 함수
  const updateURL = (sortBy, category, search, page) => {
    navigate(`/?sortBy=${sortBy}&category=${category}&search=${search}&page=${page}`, { replace: true });

    // 상태를 sessionStorage에 저장
    sessionStorage.setItem('sortBy', sortBy);
    sessionStorage.setItem('category', category);
    sessionStorage.setItem('search', search);
    sessionStorage.setItem('page', page);
  };

 // 카테고리별로 그룹화된 게시물을 생성
  const groupedPosts = posts && Array.isArray(posts) ? posts.reduce((acc, post) => {
    if (!acc[post.category]) {
      acc[post.category] = [];
    }
    acc[post.category].push(post);
    return acc;
  }, {}) : {};

  return (
    <div className="post-list">
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

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by title or ID"
            value={searchInput}
            onChange={handleSearchInputChange}
            onKeyDown={handleSearchKeyPress}
          />
          <button onClick={executeSearch}>Search</button>
        </div>
      </div>

      {Object.keys(groupedPosts).map((category) => (
        <div key={category} className="category">
          <h3>{category}</h3>

          <ul>
            {groupedPosts[category].map(post => (
              <li key={post._id} className="post-item">
                <Link to={`/posts/${post._id}`} state={{ sortBy, category }}>{post.title}</Link>
                <p>by {post.username}</p>
                {post.file && <img src={`http://localhost:3001/uploads/${post.file}`} alt={post.title} />}
                <p>Likes: {post.likes}</p>
                <button onClick={() => handleLike(post._id)}>Like</button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={currentPage === index + 1 ? 'active' : ''}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PostList;
