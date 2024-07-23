// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const app = express();

// Middleware to parse incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Dummy database to store user profiles
let profiles = [
  { id: 1, username: 'user1', password: 'password1' },
  { id: 2, username: 'user2', password: 'password2' }
];
let offlineVideos = {
  1: ['video1', 'video2'],
  2: ['video3','video4']
};

// Object to store uploaded videos by user
let uploadedVideos = {1:['uVideo1','uVideo2'], 2:['uVideo3','uVideo4'],3:['uVideo5','uVideo6']};
 
// Object to store uploaded Reels by user
let uploadedReels = {1:['uReel1','uReel2'], 2:['uReel3','uReel4']};

// Object to store user interaction data
let userInteractions = {
  likes: {},
  comments: {},
  shares: {},
  views: {}
};

// Middleware for session management
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy for username/password authentication
passport.use(new LocalStrategy(
  function(username, password, done) {
    const user = profiles.find(user => user.username === username && user.password === password);
    if (!user) {
      return done(null, false, { message: 'Incorrect username or password' });
    }
    return done(null, user);
  }
));

// Passport serialization functions
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  const user = profiles.find(user => user.id === id);
  done(null, user);
});

// Route to create a new user profile
app.post('/profiles', (req, res) => {
  const profile = req.body;
  profiles.push(profile);
  res.status(201).send('Profile created successfully');
});

// Route to delete a user profile
app.delete('/profiles/:userId', (req, res) => {
  const userId = req.params.userId;
  profiles = profiles.filter(profile => profile.userId !== userId);
  delete offlineVideos[userId];
  res.status(200).send('Profile deleted successfully');
});

// Route to download a video and add it to offline videos
app.post('/videos/:userId/download', (req, res) => {
  const userId = req.params.userId;
  const videoId = req.body.videoId;
  if (!offlineVideos[userId]) {
    offlineVideos[userId] = [];
  }
  offlineVideos[userId].push(videoId);
  res.status(200).send('Video downloaded successfully');
});

// Route to download a reel and add it to offline reels
app.post('/reels/:userId/download', (req, res) => {
  const userId = req.params.userId;
  const reelId = req.body.reelId;
  if (!offlineReels[userId]) {
    offlineReels[userId] = [];
  }
  offlineReels[userId].push(reelId);
  res.status(200).send('Reel downloaded successfully');
});

// Route to delete an offline video from a user's profile
app.delete('/videos/:userId/:videoId', (req, res) => {
  const userId = req.params.userId;
  const videoId = req.params.videoId;
  if (offlineVideos[userId]) {
    offlineVideos[userId] = offlineVideos[userId].filter(id => id !== videoId);
  }
  res.status(200).send('Offline video deleted successfully');
});

// Route to delete an offline reel from a user's profile
app.delete('/reels/:userId/:reelId', (req, res) => {
  const userId = req.params.userId;
  const reelId = req.params.reelId;
  if (offlineReels[userId]) {
    offlineReels[userId] = offlineReels[userId].filter(id => id !== reelId);
  }
  res.status(200).send('Offline reel deleted successfully');
});

// Route to register a new user
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const newUser = { id: profiles.length + 1, username, password };
  profiles.push(newUser);
  res.status(201).send('User registered successfully');
});

// Route to login
app.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}));

// Route to logout
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Route to get user profile (requires authentication)
app.get('/profile', isAuthenticated, (req, res) => {
  res.send('You are logged in');
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Route to upload a video
app.post('/videos/upload', isAuthenticated, (req, res) => {
  const userId = req.user.id;
  const video = req.body.video;
  if (!uploadedVideos[userId]) {
    uploadedVideos[userId] = [];
  }
  uploadedVideos[userId].push(video);
  res.status(200).send('Video uploaded successfully');
});

// Route to upload a reel
app.post('/reels/upload', isAuthenticated, (req, res) => {
  const userId = req.user.id;
  const reel = req.body.reel;
  // Add logic to store the uploaded reel
  res.status(200).send('Reel uploaded successfully');
});

// Route to add a comment to a video
app.post('/videos/:videoId/comments', isAuthenticated, (req, res) => {
  const userId = req.user.id;
  const videoId = req.params.videoId;
  const comment = req.body.comment;

  if (!userInteractions.comments[videoId]) {
    userInteractions.comments[videoId] = [];
  }
  userInteractions.comments[videoId].push({ userId, comment });
  res.status(200).send('Comment added successfully');
});

// Route to like a video
app.post('/videos/:videoId/like', isAuthenticated, (req, res) => {
  const videoId = req.params.videoId;

  if (!userInteractions.likes[videoId]) {
    userInteractions.likes[videoId] = 0;
  }
  userInteractions.likes[videoId]++;
  res.status(200).send('Video liked successfully');
});

// Route to share a video
app.post('/videos/:videoId/share', isAuthenticated, (req, res) => {
  const videoId = req.params.videoId;

  if (!userInteractions.shares[videoId]) {
    userInteractions.shares[videoId] = 0;
  }
  userInteractions.shares[videoId]++;
  res.status(200).send('Video shared successfully');
});

// Route to increment view count of a video
app.post('/videos/:videoId/views', (req, res) => {
  const videoId = req.params.videoId;

  if (!userInteractions.views[videoId]) {
    userInteractions.views[videoId] = 0;
  }
  userInteractions.views[videoId]++;
  res.status(200).send('View count updated successfully');
});

// Start the server
const PORT = 3007;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
