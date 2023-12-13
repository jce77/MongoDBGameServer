const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Define the schema for the Highscores collection
const highscoreSchema = new mongoose.Schema({
  username: String,
  highscore: Number,
}); 
 
// Create a model for the Highscores collection
const HighscoreModel = mongoose.model('Highscore', highscoreSchema);

const handleGetHighscores = async (res) => {
  console.log("Running handleGetHighscores");
  try {
    const highscores = await HighscoreModel.find({}, { _id: 0, __v: 0 }); // Exclude _id and __v fields
    res.json({ highscores });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

const handleAddHighscore = async (req, res, mongoConfig, accountsCollection) => {
  console.log("Running handleAddHighscore");
  try {
    const { highscore } = req.body;

    const token = req.headers.authorization;
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    // console.log("Decoded :", decoded); // to see whats inside the token
    const username = decoded.username;

    // Check if max highscores limit is reached
    const currentHighscoresCount = await HighscoreModel.countDocuments();
    const maxHighscores = 10;

    if (currentHighscoresCount < maxHighscores) 
    {
      // If there's room, add the highscore directly
      await HighscoreModel.create({ username, highscore });
    } 
    else 
    {
      // If max highscores is reached, find the lowest highscore
      const lowestHighscore = await HighscoreModel.findOne().sort({ highscore: 1 });

      // If the new highscore is higher, replace the lowest one
      if (highscore > lowestHighscore.highscore) {
        await HighscoreModel.findOneAndDelete({ _id: lowestHighscore._id });
        await HighscoreModel.create({ username, highscore });
      }
    }

    res.status(200).send('Highscore added successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  handleGetHighscores, handleAddHighscore
};