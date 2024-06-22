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

const mongoose = require('mongoose'); // mongoose 추가
const bcrypt = require('bcryptjs'); // bcrypt 패키지 추가

// MongoDB 연결 설정
mongoose.connect('mongodb://localhost:27017/myapp')
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

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


/* 몽고db 관련 */
// Mongoose 스키마 및 모델 설정
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  likes: { type: Number, default: 0 },
  file: { type: String },
  username: { type: String, required: true },
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  content: { type: String, required: true },
  username: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);
const Comment = mongoose.model('Comment', CommentSchema);

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
app.get('/profile', authenticateToken, async (req, res) => {
  try {

    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ username: user.username });
    res.status(200).json({ user, posts });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


const SALT_ROUNDS = 10;
// 인증 관련 라우트
// 회원가입 라우트
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); // 비밀번호 해시화
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 로그인 라우트
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username});

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password); // 비밀번호 비교
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
  

// 모든 게시물 조회 (Read All) - 카테고리별로 그룹화
app.get('/posts', async (req, res) => {
  const { sortBy, category, search, page = 1, limit = 10 } = req.query;

  try {
    let query = {};
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { username: new RegExp(search, 'i') }
      ];
    }

    const totalPosts = await Post.countDocuments(query); // 총 게시물 수
    let posts = await Post.find(query)
      .sort(sortBy === 'likes' ? { likes: -1 } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
      posts
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 게시물 생성 (Create)
app.post('/posts', authenticateToken, upload.single('file'), async (req, res) => {
  const { title, content, category, username } = req.body;
  try {
    const newPost = new Post({
      title,
      content,
      category,
      likes: 0,
      username,
      file: req.file ? req.file.filename : null
    });

    await newPost.save();
    res.status(201).json(newPost);

  } catch (err) {
    res.status(500).json({ message: 'Error creating post' });
  }
});


// 특정 게시물 조회 (Read One)
app.get('/posts/:id', async (req, res) => {

  try {
    console.log(`Fetching post with id: ${req.params.id}`);
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (err) {
    console.error(`Error fetching post: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});


// 게시물 수정 (Update)
app.put('/posts/:id',authenticateToken,  upload.single('file'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post.username !== req.user.username) {
      return res.status(403).json({ message: 'You are not authorized to update this post' });
    }

    if (post) {
      post.title = req.body.title || post.title;
      post.content = req.body.content || post.content;
      post.category = req.body.category || post.category;

      if (req.file) post.file = req.file.filename;

      await post.save();
      res.status(200).json(post);

    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating post' });
  }
});

// 게시물 삭제 (Delete)
app.delete('/posts/:id', authenticateToken,  async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post) {

      if (post.username !== req.user.username) {
        return res.status(403).json({ message: 'You are not authorized to delete this post' });
      }

      await Post.deleteOne({ _id: req.params.id });

      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post' });
  }
});

// 좋아요 업데이트 라우트
app.post('/posts/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post) {
      post.likes += 1;
      await post.save();
      res.status(200).json(post);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error liking post' });
  }
});


/* 댓글 관련 */
// 댓글 생성 (Create)
app.post('/posts/:id/comments', authenticateToken, async (req, res) => {
  const { content } = req.body;
  try {
    const newComment = new Comment({
      postId: req.params.id,
      content,
      username: req.user.username
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 특정 게시물의 댓글 조회 (Read)
app.get('/posts/:id/comments', async (req, res) => {

  try {
    console.log(`Fetching comments for post with id: ${req.params.id}`);
    const comments = await Comment.find({ postId: req.params.id });
    res.status(200).json(comments);
    
  } catch (err) {
    console.error(`Error fetching comments: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
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
