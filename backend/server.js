// 모듈 임포트 및 앱설정
const express = require('express');

const http = require('http'); // http 모듈 import
const socketIo = require('socket.io');

const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // CORS 미들웨어 추가
const multer = require('multer'); // multer 패키지 추가
const jwt = require('jsonwebtoken'); // jwt 패키지 추가

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // React 클라이언트의 주소
    methods: ["GET", "POST"]
  }
});


const PORT = 3001;
const SECRET_KEY = 'your_secret_key'; // 비밀 키 설정


// 미들웨어 설정
app.use(bodyParser.json()); // JSON 형식의 요청 본문을 파싱하도록 body-parser를 사용합니다.
app.use(cors()); // CORS 미들웨어 사용
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 업로드된 파일을 제공하기 위한 정적 경로 추가

// 파일 경로 설정
const usersFile = path.join(__dirname, 'data', 'users.json');
const postsFile = path.join(__dirname, 'data', 'posts.json');
const commentsFile = path.join(__dirname, 'data', 'comments.json'); // comments.json 파일의 경로를 설정합니다.

// 업로드 디렉토리 설정 및 multer 미들웨어 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
}); // 파일 업로드를 위한 디렉토리 설정 및 파일 필터 추가


// 댓글 데이터를 읽고 쓰는 함수
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

// JWT 토큰을 확인하는 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401); // 토큰이 없으면 접근 거부

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // 토큰이 유효하지 않으면 접근 거부
    req.user = user;
    next();
  });
};

// 프로필 조회
app.get('/profile', authenticateToken, (req, res) => {
  const users = readData(usersFile);
  const user = users.find(u => u.username === req.user.username);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const posts = readData(postsFile).filter(post => post.username === user.username);
  res.status(200).json({ user, posts });
});



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
      const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
      res.status(200).json({ message: 'Login successful', token });
    } else {
      res.status(400).json({ message: 'Invalid username or password' }); // 존재하지 않으면 에러 메시지를 반환.
    }
  });
  

// 모든 게시물 조회 (Read All) - 카테고리별로 그룹화
app.get('/posts', (req, res) => {

  const posts = readData(postsFile);
  const { sortBy, category, search, page = 1, limit = 10  } = req.query;

  // 카테고리 필터링
  let filteredPosts = category ? posts.filter(post => post.category === category) : posts;

  // 검색 필터링
  if (search) {
    filteredPosts = filteredPosts.filter(post =>
      (post.title && post.title.toLowerCase().includes(search.toLowerCase())) ||
      (post.username && post.username.toLowerCase().includes(search.toLowerCase()))
    );
  }


  // 정렬
  if (sortBy === 'likes') {
    filteredPosts.sort((a, b) => b.likes - a.likes);
  } else if (sortBy === 'comments') {
    const comments = readData(commentsFile);

    filteredPosts.sort((a, b) => {

      const aComments = comments.filter(comment => comment.postId === a.id).length;
      const bComments = comments.filter(comment => comment.postId === b.id).length;
      
      return bComments - aComments;
    });
  } else {
    // 기본적으로 최신순 정렬
    filteredPosts.sort((a, b) => b.id - a.id);
  }

  // 페이지네이션
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  res.status(200).json({
    totalPages: Math.ceil(filteredPosts.length / limit),
    currentPage: page,
    posts: paginatedPosts,
  });
  
});

// 게시물 생성 (Create)
app.post('/posts', authenticateToken,  upload.single('file'), (req, res) => {
  const posts = readData(postsFile); // 기존 게시글 데이터를 읽어옵니다.
  
  const newPost = { 
    id: Date.now(), 
    title: req.body.title,
    content: req.body.content,
    category: req.body.category,
    likes: 0, // 좋아요 수를 초기화합니다.
    file: req.file ? req.file.filename : null, // 업로드된 파일의 이름을 저장합니다.
    username: req.body.username // 사용자 이름을 게시글에 추가합니다.
  }; // 새로운 게시글을 생성.
  
  posts.push(newPost);  // 새로운 게시글을 배열에 추가.
  writeData(postsFile, posts); // 게시글 데이터를 파일에 씁니다.
  res.status(201).json(newPost); // 새 게시글 데이터를 반환.
});


// 특정 게시물 조회 (Read One)
app.get('/posts/:id', (req, res) => {
  const posts = readData(postsFile); // 기존 게시글 데이터를 읽기.
  const post = posts.find(p => p.id === parseInt(req.params.id));
  
  if (post) {
    res.status(200).json(post); // 게시글이 존재하면 반환.
  } else {
    res.status(404).json({ message: 'Post not found' }); // 게시글이 없으면 에러 메시지를 반환.
  }
});

// 게시물 수정 (Update)
app.put('/posts/:id', upload.single('file'),  (req, res) => {
  const posts = readData(postsFile);
  const index = posts.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index !== -1) {
    const updatedPost = { ...posts[index], ...req.body };
    
    if (req.file) {
      updatedPost.file  = req.file.filename;
    }

    posts[index] = updatedPost; // 업데이트된 게시물을 배열에 반영합니다.
    writeData(postsFile, posts);

    res.status(200).json(posts[index]);
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
});

// 게시물 삭제 (Delete)
app.delete('/posts/:id', (req, res) => {
  const posts = readData(postsFile);
  const filteredPosts = posts.filter(p => p.id !== parseInt(req.params.id));
  
  if (posts.length !== filteredPosts.length) {
    writeData(postsFile, filteredPosts);
    res.status(204).send();

  } else {
    res.status(404).json({ message: 'Post not found' });
  }
});

// 좋아요 업데이트 라우트
app.post('/posts/:id/like', (req, res) => {
  const posts = readData(postsFile);
  const index = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (index !== -1) {

    posts[index].likes = (posts[index].likes || 0) + 1;
    writeData(postsFile, posts);

    res.status(200).json(posts[index]);

  } else {
    res.status(404).json({ message: 'Post not found' });
  }
});


/* 댓글 관련 */
// 댓글 생성 (Create)
app.post('/posts/:id/comments', (req, res) => {
  const comments = readData(commentsFile);
  const { content } = req.body; // content 변수를 요청 본문에서 가져오기
  const newComment = { id: Date.now(), postId: parseInt(req.params.id), content };
  
  comments.push(newComment);
  writeData(commentsFile, comments);
  
  res.status(201).json(newComment);
});

// 특정 게시물의 댓글 조회 (Read)
app.get('/posts/:id/comments', (req, res) => {
  
  const comments = readData(commentsFile);
  const postComments = comments.filter(comment => comment.postId === parseInt(req.params.id));
  
  res.status(200).json(postComments);
});


/* 채팅 관련 */
// 방 목록 관리
const rooms = new Map();


// 채팅 설정(여러 방 지원 추가)
io.on('connection', (socket) => {
  console.log('a user connected');


  // 클라이언트에 방 목록을 전송하는 함수
  const updateRoomList = () => {
    io.emit('room list', Array.from(rooms.keys()));
  };

  const updateRoomLeader = (room) => {
    const roomData = rooms.get(room);

    if (roomData && roomData.users.size > 0) {
      const newLeader = Array.from(roomData.users.keys())[0];
      roomData.leader = newLeader;
      const leaderName = roomData.users.get(newLeader);

      io.to(room).emit('update leader', { room, leader: leaderName  });
    }
  };

  // 클라이언트에서 방을 생성하는 이벤트 수신
  socket.on('create room', ({ room, username }) => {

    if (!rooms.has(room)) {
      rooms.set(room, { users: new Map(), leader: socket.id });
    }
    rooms.get(room).users.set(socket.id, username);
    socket.join(room);

    updateRoomList();
    updateRoomLeader(room);
  });

  // 클라이언트에서 방에 참가하는 이벤트 수신
  socket.on('join room', ({ room, username }) => {

    socket.join(room);

    if (!rooms.has(room)) {
      rooms.set(room, { users: new Map(), leader: null });
    }

    rooms.get(room).users.set(socket.id, username);
    if (!rooms.get(room).leader) {
      rooms.get(room).leader = socket.id;
    }

    console.log(`User joined room: ${room}`);

    updateRoomList();
    updateRoomLeader(room);
  });

  // 클라이언트에서 방을 나가는 이벤트 수신
  socket.on('leave room', (room) => {
    socket.leave(room);

    if (rooms.has(room)) {
      rooms.get(room).users.delete(socket.id);
      if (rooms.get(room).users.size === 0) {
        rooms.delete(room);
      } else if (rooms.get(room).leader === socket.id) {
        updateRoomLeader(room);
      }
    }

    console.log(`User left room: ${room}`);
    updateRoomList();

  });

  socket.on('disconnect', () => {
    console.log('user disconnected');

    rooms.forEach((roomData, room) => {
      roomData.users.delete(socket.id);
      if (roomData.users.size === 0) {
        rooms.delete(room);
      } else if (roomData.leader === socket.id) {
        updateRoomLeader(room);
      }
    });

    updateRoomList();
  });

  // 방에 있는 클라이언트에게 메시지 보내기
  socket.on('chat message', (msg) => {
    io.to(msg.room).emit('chat message', msg);
  });

  // 클라이언트 연결 시 초기 방 목록 전송
  updateRoomList();

});


// 서버 시작
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
