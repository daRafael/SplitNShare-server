const express = require("express");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const Balance = require("../models/Balance.model.js")
const { isAuthenticated } = require('./../middleware/jwt.middleware.js');
const router = express.Router();
const saltRounds = 12;

// sign up
router.post('/signup', (req, res) => {
  const { email, password, username } = req.body;

  // Validate input fields
  if (!email || !password || !username) {
    return res.status(400).json({ message: "Provide email, password, and name" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Provide a valid email address.' });
  }
  
  // Validate password strength
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Password must have at least 6 characters and contain at least one number, one lowercase, and one uppercase letter.' });
  }

  // Check if user already exists
  User.findOne({ email })
    .then((foundUser) => {
      if (foundUser) {
        return res.status(400).json({ message: "User already exists." });
      }

      // Hash password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Create user
      return User.create({ email, password: hashedPassword, username })
        .then((createdUser) => {
          // Create balance for new user
          return Balance.create({ user: createdUser._id })
            .then((balance) => {
              // Update user with associated balance
              return User.findByIdAndUpdate(
                createdUser._id,
                { $set: { balance: balance._id } },
                { new: true }
              );
            })
            .then((updatedUser) => {
              // Return user data
              const { email, username, _id } = updatedUser;
              const user = { email, username, _id };
              res.status(201).json({ user });
            });
        });
    })
    .catch((err) => {
      console.log('Error while signing up user', err);
      res.status(500).json({ message: "Internal Server Error" })
    });
});
// login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Provide email and password." });
    return;
  }

  User.findOne({ email })
    .then((foundUser) => {
    
      if (!foundUser) {
        res.status(401).json({ message: "User not found." })
        return;
      }

      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        const { _id, email, username } = foundUser;
        
        const payload = { _id, email, username };

        const authToken = jwt.sign( 
          payload,
          process.env.SECRET_TOKEN,
          { algorithm: 'HS256', expiresIn: "6h" }
        );

        res.status(200).json({ authToken: authToken });
      }
      else {
        res.status(401).json({ message: "Unable to authenticate the user" });
      }

    })
    .catch((err) => {
      console.error('Error while logging in user', err)
      res.status(500).json({ message: "Internal Server Error" });
    });
});

// GET 
router.get('/verify', isAuthenticated, (req, res) => {

  console.log(`req.payload`, req.payload);

  res.status(200).json(req.payload);
});

module.exports = router;