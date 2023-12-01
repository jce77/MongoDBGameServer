const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/gamedb', { useNewUrlParser: true, useUnifiedTopology: true });

// Define the schema for the Highscores collection
const highscoreSchema = new mongoose.Schema({
  name: String,
  highscore: Number,
});

// Create a model for the Highscores collection
const HighscoreModel = mongoose.model('Highscore', highscoreSchema);

app.get('/highscores', async (req, res) => {
    try {
      const highscores = await HighscoreModel.find({}, { _id: 0, __v: 0 }); // Exclude _id and __v fields
      res.json({ highscores });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});