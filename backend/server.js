const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // CORS 미들웨어 추가

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(cors()); // CORS 미들웨어 사용

const usersFile = path.join(__dirname, 'data', 'users.json');
const postsFile = path.join(__dirname, 'data', 'posts.json');

// Utility function to read data from a file
const readData = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    return [];
  }
};

// Utility function to write data to a file
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Auth routes
app.post('/register', (req, res) => {
  const users = readData(usersFile);
  const { username, password } = req.body;

  if (users.find(user => user.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  users.push({ username, password });
  writeData(usersFile, users);
  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/login', (req, res) => {
    const users = readData(usersFile);
    const { username, password } = req.body;
  
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(400).json({ message: 'Invalid username or password' });
    }
  });
  

// Posts routes
app.get('/posts', (req, res) => {
  const posts = readData(postsFile);
  res.status(200).json(posts);
});

app.post('/posts', (req, res) => {
  const posts = readData(postsFile);
  const newPost = { id: Date.now(), ...req.body };
  posts.push(newPost);
  writeData(postsFile, posts);
  res.status(201).json(newPost);
});

app.get('/posts/:id', (req, res) => {
  const posts = readData(postsFile);
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (post) {
    res.status(200).json(post);
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
});

// Starting the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
