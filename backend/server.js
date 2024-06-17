// 모듈 임포트 및 앱설정
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // CORS 미들웨어 추가

const app = express();
const PORT = 3001;

// 미들웨어 설정
app.use(bodyParser.json()); // JSON 형식의 요청 본문을 파싱하도록 body-parser를 사용합니다.
app.use(cors()); // CORS 미들웨어 사용

// 파일 경로 설정
const usersFile = path.join(__dirname, 'data', 'users.json');
const postsFile = path.join(__dirname, 'data', 'posts.json');

// 파일에서 데이터를 읽어오는 유틸리티 함수
const readData = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath)); // 파일을 읽고 JSON 형식으로 파싱합니다.
    
  } catch (error) {
    return []; // 오류가 발생하면 빈 배열을 반환합니다.
  }
};

// 데이터를 파일에 쓰는 유틸리티 함수
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// 인증 관련 라우트

// 회원가입 라우트
app.post('/register', (req, res) => {
  const users = readData(usersFile); // 기존 사용자 데이터를 읽기.
  const { username, password } = req.body; // 요청 본문에서 username과 password를 가져오기..

  if (users.find(user => user.username === username)) { // 동일한 username이 존재하는지 확인..
    return res.status(400).json({ message: 'User already exists' }); // 이미 존재하면 에러 메시지를 반환.
  }

  users.push({ username, password }); // 새로운 사용자를 추가.
  writeData(usersFile, users); // 사용자 데이터를 파일에 쓰기.
  res.status(201).json({ message: 'User registered successfully' }); // 성공 메시지를 반환.
});

// 로그인 라우트
app.post('/login', (req, res) => {

    const users = readData(usersFile); // 기존 사용자 데이터를 읽기.
    const { username, password } = req.body; // 요청 본문에서 username과 password를 가져오기.
  
    const user = users.find(user => user.username === username && user.password === password); // 해당 사용자 정보를 찾기.
    if (user) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(400).json({ message: 'Invalid username or password' }); // 존재하지 않으면 에러 메시지를 반환.
    }
  });
  

// 모든 게시글을 가져오는 라우트
app.get('/posts', (req, res) => {
  const posts = readData(postsFile); // 기존 게시글 데이터를 읽어옵니다.
  res.status(200).json(posts); // 게시글 데이터를 반환.
});

// 새로운 게시글을 추가하는 라우트
app.post('/posts', (req, res) => {
  const posts = readData(postsFile); // 기존 게시글 데이터를 읽어옵니다.
  const newPost = { id: Date.now(), ...req.body }; // 새로운 게시글을 생성.
  
  posts.push(newPost);  // 새로운 게시글을 배열에 추가.
  writeData(postsFile, posts); // 게시글 데이터를 파일에 씁니다.
  res.status(201).json(newPost); // 새 게시글 데이터를 반환.
});


// 특정 ID의 게시글을 가져오는 라우트
app.get('/posts/:id', (req, res) => {
  const posts = readData(postsFile); // 기존 게시글 데이터를 읽기.
  const post = posts.find(p => p.id === parseInt(req.params.id));
  
  if (post) {
    res.status(200).json(post); // 게시글이 존재하면 반환.
  } else {
    res.status(404).json({ message: 'Post not found' }); // 게시글이 없으면 에러 메시지를 반환.
  }
});

// 서버를 시작.
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
