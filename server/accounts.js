const nodemailer = require('nodemailer');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken');
const { passwordIsValid, usernameIsValid, emailIsValid } = require('./validation');

const tryAuthenticateUser = async (req, res, mongoConfig, accountsCollection) => {
  console.log('tryAuthenticateUser Start.')
  
  const { username, password } = req.body;

  try {
      let user;
      const url = mongoConfig.url;
      const dbName = mongoConfig.dbName;
      const client = new MongoClient(url, { useUnifiedTopology: true });
      await client.connect();
      const db = client.db(dbName);
      

      // Check if the input is a valid email format
      const isEmailFormat = /\S+@\S+\.\S+/.test(username);

      if (isEmailFormat) {
          // If it's a valid email, find the user by email
          user = await db.collection(accountsCollection).findOne({ email: username });
      } else {
          // If it's not a valid email, find the user by username
          user = await db.collection(accountsCollection).findOne({ username });
      }

      // Check if the user exists
      if (!user) {
          console.log('Authentication failed. User not found.')
          return res.status(401).json({ message: 'Authentication failed. User not found.' });
      }



      // Compare the input password to the stored hashed-password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      // Check if the passwords match
      if (isPasswordValid) {
          // Generate a token
          const token = jwt.sign({ userId: user._id, username: user.username }, process.env.SECRET_KEY, { expiresIn: '1h' });

          // Include the token in the response
          return res.status(200).json({ message: 'Authentication successful.', token, username: user.username });
      } else {
          console.log('Authentication failed. Invalid password.')
          // Passwords do not match, authentication failed
          return res.status(406).json({ message: 'Authentication failed. Invalid password.' });
      }
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error.' });
  }
};


const tryRegisterUser = async (req, res, mongoConfig) => {
  const { username, password, email } = req.body;

  // first doing validity checking
  if(!usernameIsValid(username))
  {
    console.log("error: The client shouldn't have allowed this username to be sent. Possible bot?");
    return res.status(407).json({ error: 'Username is not valid.' });
  }
  if(!passwordIsValid(password))
  {
    console.log("error: The client shouldn't have allowed this password to be sent. Possible bot?");
    return res.status(408).json({ error: 'Password is not valid.' });
  }
  if(!emailIsValid(email))
  {
    console.log("error: The client shouldn't have allowed this email to be sent. Possible bot?");
    return res.status(409).json({ error: 'Email is not valid.' });
  } 


  console.log("Running /register, username=" + username + ", password=" + password + ", email=" + email);
  // Access MongoDB connection details using `mongoConfig`
  const url = mongoConfig.url;
  const dbName = mongoConfig.dbName;
  const accountsCollection = 'accounts';
  const verificationsCollection = 'verifications';
  console.log("url=", url);
  console.log("dbName=", dbName);
  try {
      const client = new MongoClient(url, { useUnifiedTopology: true });
      await client.connect();
      const db = client.db(dbName);

      // Check if the username or email already exists
      const existingUser = await db.collection(accountsCollection).findOne({
      $or: [{ username: username }, { email: email }]
      });

      if (existingUser) {
        console.log("error: 'Username or email already registered'");
        // User or email already exists
        return res.status(410).json({ error: 'Username or email already registered' });
      } 
      else 
      {
        console.log("Inserting the new account into the collection");
        
        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the 'accounts' collection
        await db.collection(accountsCollection).insertOne({
            username: username,
            password: hashedPassword,
            email: email,
            verified: 'N' // Default to not verified
      });

      // Generate verification code
      const verificationCode = generateVerificationCode();

      // Insert verification entry into the 'verifications' collection
      await db.collection(verificationsCollection).insertOne({
          email: email,
          code: verificationCode
      });

      // skipping for now
      // Send verification email
      //sendVerificationEmail(email, verificationCode);


      res.status(201).json({ success: 'User registered successfully. Check your email for verification.' });
      }

      client.close();
  } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


function generateVerificationCode() {
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

function sendVerificationEmail(toEmail, verificationCode) {
  
  // Nodemailer setup
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      // INSTRUCTIONS --------------------------------|
      // Add file '.env' to folder with 'index.js'
      // inside it add the lines:
      //    EMAIL_USER=your-email@gmail.com
      //    EMAIL_PASS=your-email-password
      // ---------------------------------------------|
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});


const mailOptions = {
  from: process.env.EMAIL_USER, // Use the configured email user here
  to: toEmail,
  subject: 'Verification code',
  text: `Your verification code is: ${verificationCode}`
};

console.log("sendVerificationEmail");
console.log("toEmail=", toEmail);
console.log("verificationCode=", verificationCode);

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
}

module.exports = {
  tryRegisterUser, tryAuthenticateUser
};