// const express = require('express');
// const bodyParser = require('body-parser');
// const mysql = require('mysql');

// const app = express();
// const port = 3000; // You can change this port as per your requirement

// // Create MySQL connection
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root', // Replace with your XAMPP username
//   password: '12345678', // Replace with your XAMPP password (leave blank if no password)
//   database: 'earnflix', 
// });

// // Connect to MySQL
// connection.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL database:', err);
//     return;
//   }
//   console.log('Connected to MySQL database');
// });

// // Middleware
// app.use(bodyParser.json());

// // Login route
// app.post('/login', (req, res) => {
//   const { username, password } = req.body;

//   // Query to check username and password
//   const query = 'SELECT * FROM users WHERE username = ?';

//   connection.query(query, [username], (error, results) => {
//     if (error) {
//       console.error('Error executing query:', error);
//       res.status(500).json({ status: 500, message: 'Internal server error' });
//       return;
//     }

//     if (results.length === 0) {
//       res.status(401).json({ status: 401, message: 'Username not found' });
//       return;
//     }

//     const user = results[0];

//     if (user.password !== password) {
//       res.status(401).json({ status: 401, message: 'Incorrect password' });
//       return;
//     }

//     res.status(200).json({ status: 200, message: 'Login successful' });
//   });
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });









const express = require('express');

const mysql = require('mysql2/promise');
const cors = require('cors');
const User = require('./models/User'); // Import User model
const UserRecord = require('./models/UserRecord')
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
app.post('/login', upload.none(), async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({  status:401,message: 'Invalid username or password' });
    }

    const user = rows[0];
    // const isMatch = await bcrypt.compare(password, user.password);
    if (user.password != password) {
      return res.status(401).json({ status:401,message: 'Invalid password' });
    }

    // Login successful (replace with your actual logic for handling successful login)
    res.json({ status:200,message: 'Login successful!', user }); // You can send user data here (consider security implications)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



/////////get user by id///////


app.get('/get-user-info/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(401).json({status:401, message: 'User ID is required!' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    const user = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (user[0].length === 0) {
      connection.end();
      return res.status(401).json({status:401, message: 'User not found!' });
    }

    // Consider security implications of sending back sensitive data (e.g., password)
    connection.end();

    res.json({ status:200,data: user[0][0] }); // Access first element of first row
  } catch (error) {
    console.error(error);
    res.status(500).json({ status:500,message: 'Internal server error' });
  }
});


/////////// get all users ///////////////////



app.get('/get-all-users', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    const users = await connection.query('SELECT * FROM users');

    connection.end();

    res.json({ status:200,data: users[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({status:500, message: 'Internal server error' });
  }
});









// Create a user record
app.post('/post-user-records', upload.none(), async (req, res) => {
  const { userId, timeSpent, segmentEarning } = req.body;
  if (!userId || !timeSpent || !segmentEarning) {
    return res.status(401).json({ status:401,message: 'All fields are required!' });
  }

  const connection = await mysql.createConnection(dbConfig);
  try {
    const record = new UserRecord(userId, timeSpent, segmentEarning);
    await record.save(connection);

    // Calculate user finance data
    const incomePerMinute = 0.5; // Replace with your desired earning rate
    const totalIncome = timeSpent * incomePerMinute;
    const totalBalance = totalIncome; // Assuming initial balance is equal to income

    const existingFinance = await connection.query(
      'SELECT * FROM user_finance WHERE user_id = ?',
      [userId]
    );
    const { id } =  existingFinance[0];

    const updatedIncome = await existingFinance[0].id

    if (existingFinance[0].length === 0) {
      // Create new user finance record
      await connection.query('INSERT INTO user_finance SET ?', {
        user_id: userId,
        total_income: totalIncome,
        total_balance: totalBalance,
        total_withdraw: 0,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });

    } else {
      // Update existing user finance record
  
      const existingData = await existingFinance[0]; 
      const updatedIncome =  existingData[0].total_income + totalIncome
      const updatedBalance =  existingData[0].total_balance + totalBalance
      await connection.query('UPDATE user_finance SET total_income = ?, total_balance = ? WHERE user_id = ?', [updatedIncome, updatedBalance, userId] )
    
    }

    res.json({status:200, message: 'User record created successfully!'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await connection.end();
  }
});

// Fetch user record by user ID
app.get('/get-user-records/:userId', async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(401).json({ status:401,message: 'User ID is required!' });
  }

  const connection = await mysql.createConnection(dbConfig);
  try {
    const record = await UserRecord.fetchByUserId(connection, userId);
    if (!record) {
      return res.status(401).json({status:401, message: 'User record not found' });
    }
    res.json({ status:200,message: 'Data fetched successfully',data:record })
    // res.json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await connection.end();
  }
});


/////FETCH USER RECORD BY USER ID///////////


app.get('/get-user-finance/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(401).json({ status:401,message: 'User ID is required!' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    const userFinance = await connection.query('SELECT total_withdraw, total_balance, total_income FROM user_finance WHERE user_id = ?', [userId]);

    if (userFinance[0].length === 0) {
      connection.end();
      return res.status(401).json({ status:401,message: 'User not found!' });
    }

    connection.end();

    res.json({ status:200,data: userFinance[0][0] }); // Access first element of first row
  } catch (error) {
    console.error(error);
    res.status(500).json({ status:500,message: 'Internal server error' });
  }
});







//// WITTHDRAW API 

app.post('/withdraw-request', upload.none(),async (req, res) => {
  const { userId, withdrawAmount, accountNumber, accountType, accountTitle } = req.body;

  if (!userId || !withdrawAmount || !accountNumber || !accountType || !accountTitle) {
    return res.status(401).json({ status:401,message: 'All fields are required!' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Start a transaction (for ACID operations)
    await connection.beginTransaction();

    // Check for existing pending withdrawal
    const existingWithdrawals = await connection.query('SELECT * FROM request_withdrawls WHERE user_id = ? AND approved = false', [userId]);

    if (existingWithdrawals[0].length > 0) {
      await connection.rollback(); // Rollback if existing pending request
      connection.end();
      return res.status(401).json({status:401, message: 'You cannot request another amount! There is an amount already waiting to be approved.' });
    }

    // Check user balance
    const userBalance = await connection.query('SELECT total_balance FROM user_finance WHERE user_id = ?', [userId]);

    if (userBalance[0].length === 0) {
      await connection.rollback(); // Rollback if user not found
      connection.end();
      return res.status(401).json({ status:401,message: 'User not found!' });
    }

    if (userBalance[0][0].total_balance < withdrawAmount) {
      await connection.rollback(); // Rollback if insufficient balance
      connection.end();
      return res.status(401).json({status:401, message: 'You do not have sufficient balance!' });
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' '); // Formatted timestamp

    await connection.query('INSERT INTO request_withdrawls SET ?', {
      user_id: userId,
      withdraw_amount: withdrawAmount,
      account_number: accountNumber,
      account_type: accountType,
      account_title: accountTitle,
      approved: false,
      created_at: now,
      updated_at: now,
    });

    // Commit the transaction (permanent changes)
    await connection.commit();

    connection.end();

    res.json({ status:200,message: 'Withdrawal request submitted successfully!' });
  } catch (error) {
    console.error(error);
    // Rollback the transaction on any error
    await connection.rollback();
    connection.end();
    res.status(500).json({ status:500,message: 'Internal server error' });
  }
});





//APPROVE WITHDRAW REQUEST/////////


app.put('/approve-requests/:withdrawId', async (req, res) => {
  const { withdrawId } = req.params;

  if (!withdrawId) {
    return res.status(401).json({ status:401,message: 'Withdrawal ID is required!' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Start a transaction (for ACID operations)
    await connection.beginTransaction();

    // Fetch withdrawal details for verification
    const withdrawal = await connection.query('SELECT * FROM request_withdrawls WHERE id = ?', [withdrawId]);

    if (withdrawal[0].length === 0) {
      await connection.rollback(); // Rollback if withdrawal not found
      connection.end();
      return res.status(401).json({ status:401,message: 'Withdrawal request not found!' });
    }

    // Check if withdrawal is already approved
    if (withdrawal[0][0].approved) {
      await connection.rollback(); // Rollback if already approved
      connection.end();
      return res.status(401).json({ status:401,message: 'Withdrawal amount already approved!' });
    }

    const userId = withdrawal[0][0].user_id;
    const withdrawAmount = withdrawal[0][0].withdraw_amount;

    // Update user_withdraws table (set approved to true)
    await connection.query('UPDATE request_withdrawls SET approved = true, updated_at = NOW() WHERE id = ?', [withdrawId]);

    // Update user_finance table (deduct from total_balance, add to total_withdraw)
    await connection.query('UPDATE user_finance SET total_balance = total_balance - ?, total_withdraw = total_withdraw + ? WHERE user_id = ?', [withdrawAmount, withdrawAmount, userId]);

    // Commit the transaction (permanent changes)
    await connection.commit();

    connection.end();

    res.json({ status:401,message: 'Withdrawal request approved successfully!' });
  } catch (error) {
    console.error(error);
    // Rollback the transaction on any error
    await connection.rollback();
    connection.end();
    res.status(500).json({ status:500,message: 'Internal server error' });
  }
});


///////////FWETCH USER WITHDRAWLSSSS/////////////




app.get('/get-all-withdraws-user-id/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({status:401, message: 'User ID is required!' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    const withdrawals = await connection.query('SELECT * FROM request_withdrawls WHERE user_id = ?', [userId]);

    if (withdrawals[0].length === 0) {
      connection.end();
      return res.json({ status:401,message: 'No withdrawal requests found for this user.' }); // Informative message
    }

    connection.end();

    res.json({ status:200,data: withdrawals[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status:500,message: 'Internal server error' });
  }
});




////////FETCH ALL WITHDRAWS//////////


app.get('/get-all-withdrawals', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    const withdrawals = await connection.query('SELECT * FROM request_withdrawls');

    connection.end();

    res.json({ status:200,data: withdrawals[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status:500,message: 'Internal server error' });
  }
});



// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
