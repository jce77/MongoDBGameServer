const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

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

// Middleware to parse JSON requests
app.use(bodyParser.json());

app.get('/highscores', async (req, res) => {
    try {
      const highscores = await HighscoreModel.find({}, { _id: 0, __v: 0 }); // Exclude _id and __v fields
      res.json({ highscores });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


// Express route to add a new highscore
app.post('/addhighscore', async (req, res) => {
    try {
      const { name, highscore } = req.body;
  
      // Check if max highscores limit is reached
      const currentHighscoresCount = await HighscoreModel.countDocuments();
      const maxHighscores = 10;
  
      if (currentHighscoresCount < maxHighscores) 
      {
        // If there's room, add the highscore directly
        await HighscoreModel.create({ name, highscore });
      } 
      else 
      {
        // If max highscores is reached, find the lowest highscore
        const lowestHighscore = await HighscoreModel.findOne().sort({ highscore: 1 });
  
        // If the new highscore is higher, replace the lowest one
        if (highscore > lowestHighscore.highscore) {
          await HighscoreModel.findOneAndDelete({ _id: lowestHighscore._id });
          await HighscoreModel.create({ name, highscore });
        }
      }
  
      res.status(200).send('Highscore added successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});