const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//setting up the connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'users',
});

//Create database with name = "users" and table with name = "users" and connecting to it.
connection.connect((error) => {
  if (error) {
    console.error('Error connecting to database:', error);
  } else {
    console.log('Connected to database');
  }
});


//Creating user class and encrypting the password
class User {
  constructor(firstName, lastName, email, password) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
  }
 //function to save data to database
  async save() {
    try {
      const hashedPassword = await bcrypt.hash(this.password, 10);
      const query = `INSERT INTO users (first_name, last_name, email, password) VALUES ('${this.firstName}', '${this.lastName}', '${this.email}', '${hashedPassword}')`;
      connection.query(query, (error, results) => {
        if (error) {
          console.error(error);
        } else {
          console.log(results);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
}


//signup route
app.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const user = new User(firstName, lastName, email, password);
    await user.save();
    res.status(200).send('User created successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});



//login route
app.post("/login", async (req, res) => {
  try {
    const {email, password } = req.body;
    const query = `SELECT * FROM users WHERE email='${email}'`;
    connection.query(query, async (error, results) => {
      if (error) {
        console.error(error);
      } else {
        if (results.length === 0) {
          console.log('User not found');
          res.send("User not found");
          return null;
        } else {
          const user = results[0];
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (isPasswordValid) {
            const token = jwt.sign({ userId: user.id }, 'secret');
            console.log('Token:', token);
            res.send(user);
            return null;
          } else {
            console.log('Invalid password');
            res.send("Invalid Password");
            return null;
          }
        }
      }
    });
  } catch (error) {
    console.error(error);
  }
});

//Setting up the server
app.listen(port,()=>{
  console.log(`Server is up and running on port ${port}`);
})
