const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { tryRegisterUser, tryAuthenticateUser } = require('./accounts');
const { handleGetHighscores, handleAddHighscore } = require('./highscore');
require('dotenv').config();
const app = express();
const port = 3000;
const jwt = require('jsonwebtoken');

// MongoDB Connection Details
const mongoConfig = {
  url: 'mongodb://127.0.0.1:27017',
  dbName: 'gamedb'
};

const accountsCollection = 'accounts';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/gamedb', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware to parse JSON requests
app.use(bodyParser.json());

// -------------- express routes ==============================

app.get('/highscores', async (req, res) => {
  console.log("/highscores");
  handleGetHighscores(res);
  });

app.post('/addhighscore', verifyToken, async (req, res) => {
  console.log("/addhighscore");
  handleAddHighscore(req, res, mongoConfig, accountsCollection);
  });

app.post('/register', async (req, res) => {
  console.log("/register");
  tryRegisterUser(req, res, mongoConfig)
  });

app.post('/authenticate', async (req, res) => {
  console.log("/authenticate");
  tryAuthenticateUser(req, res, mongoConfig, accountsCollection);
  });

// ----------------------------------------------------------  

// Middleware to verify the token
function verifyToken(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    console.log("ERROR: Token not provided");
    return res.status(403).send('Token not provided');
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log("ERROR: Invalid token: " + token);
      console.log(err);  // Log the actual error for more details
      return res.status(401).send('Invalid token');
    }
    req.userId = decoded.userId;
    next();
  });
}


// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});