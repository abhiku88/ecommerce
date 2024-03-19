// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();

// MongoDB connection
mongoose.connect('mongodb+srv://abhikuchaubey:dM8Ov5dH0KQei9mH@cluster0.as6ohjo.mongodb.net/userDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB");
});

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  image: String,
  emailVerified: Boolean,
  mobileOTP: String
});

const User = mongoose.model('User', userSchema);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Sign-up endpoint
app.post('/signup', upload.single('image'), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      image: req.file.filename,
      emailVerified: false,
      mobileOTP: Math.floor(100000 + Math.random() * 900000).toString()
    });
    await user.save();
    // Send verification email
    // Setup Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'anhishekkumar18@gmail.com',
        pass: '@123Ragini'
      }
    });

    // Send verification email
    await transporter.sendMail({
      from: 'anhishekkumar18@gmail.com',
      to: email,
      subject: 'Email Verification',
      text: `Your OTP for email verification is: ${user.mobileOTP}`
    });

    res.status(201).send({ message: 'User registered successfully. Please verify your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Sign-in endpoint
app.post('/signin', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, 'secretkey');
    res.send({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Admin panel endpoint
app.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
