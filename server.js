const express = require('express');

const mysql = require('mysql2/promise');
const cors = require('cors');
const User = require('./models/User'); // Import User model
const dbConfig = require('./config/db.config'); // Import database configuration
const multer = require('multer');

const upload = multer({ dest: 'uploads/' }); 
const app = express();
app.use(cors());
app.use(express.json()); // Parse incoming JSON data

// Connect to MySQL database
const pool = mysql.createPool(dbConfig);

// **Registration API** (POST request to '/register')
app.post('/register', upload.none(), async (req, res) => {
  const { username,password,  email, firstname, lastname } = req.body;
const usernam = req.body.username
  if (!username || !email || !password || !firstname || !lastname) {
    return res.status(400).json({ message: `All fields are requsired!'${req.body.username} ss` });
  }

  try {
    const user = new User(username,password, email,  firstname, lastname);
    await user.save();
    res.json({ message: 'Registration successful!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// **Login API** (POST request to '/login')
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Login successful (replace with your actual logic for handling successful login)
    res.json({ message: 'Login successful!', user }); // You can send user data here (consider security implications)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
