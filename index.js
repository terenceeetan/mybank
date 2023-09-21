const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const mysql = require('mysql2'); // Import the mysql2 library cause we are using mysql database
require('dotenv').config();

// Create a MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

const app = express();
const port = 3000;

//Initialize the app and add middleware
app.set("view engine", "pug"); //Setup the pug
app.use(bodyParser.urlencoded({ extended: true })); //Setup the body parser to handle form submits
app.use(session({ secret: "super-secret" })); //Session setup

/** Handle login display and form submit */
app.get("/login", (req, res) => {
  if (req.session.isLoggedIn === true) {
    return res.redirect("/");
  }
  res.render("login", { error: false });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  // Query the database for the user with the provided username and password
  db.query(
    'SELECT * FROM accounts WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) {
        console.error(err);
        res.render("login", { error: "An error occurred while processing your request" });
      } else if (results.length > 0) {
        // If a user with matching credentials is found, set the session as authenticated
        req.session.isLoggedIn = true
        req.session.userID = results[0]['id']
        res.redirect(req.query.redirect_url ? req.query.redirect_url : "/");
      } else {
        // If no matching user is found, render the login page with an error message
        res.render("login", { error: "Username or password is incorrect" });
      }
    }
  );
});

/** Handle logout function */
app.get("/logout", (req, res) => {
  req.session.isLoggedIn = false;
  res.redirect("/");
});

/** Simulated bank functionality */
app.get("/", (req, res) => {
  res.render("index", { isLoggedIn: req.session.isLoggedIn });
});

app.get("/balance", (req, res) => {
  if (req.session.isLoggedIn === true) {
    res.send("Your account balance is $1234.52");
  } else {
    res.redirect("/login?redirect_url=/balance");
  }
});

app.get("/account", (req, res) => {
  if (req.session.isLoggedIn === true) {
    res.send("Your account number is ACL9D42294");
  } else {
    res.redirect("/login?redirect_url=/account");
  }
});

app.get("/contact", (req, res) => {
  res.send("Our address : 321 Main Street, Beverly Hills.");
});

app.get("/update_email_address", (req, res) => {
  if (req.session.isLoggedIn === true) {
    res.render(view= "update_email");
  } else {
    res.redirect("/login?redirect_url=/update_email_address");
  }
})

app.post("/update_email_address", (req, res) => {
  const { old_email, new_email, confirm_email } = req.body;
  if (new_email != confirm_email) {
    res.render("update_email", {error: "New email address does not match"}) 
  }
  db.query(
    "UPDATE accounts SET email=(?) WHERE id =? AND email=?",
    [new_email, req.session.userID, old_email],
    (err, results) => {
      if (err) {
        console.error(err);
        res.render("login", { error: "An error occurred while processing your request" });
      } else if (results.affectedRows > 0) {
        // When affectedRows more than 0 it means that the change was successful
        res.render("update_email", {success: "Email updated successfully"});
      } else {
        // If no matching user is found, render the update email view with an error message
        res.render("update_email", { error: "Your email does not match your account's record" });
      }
    }
  );
})

app.get("/user", (req, res) => {
  if (req.session.isLoggedIn === true) {
    db.query(
      'SELECT * FROM accounts WHERE id = ?',
      [req.session.userID],
      (err, results) => {
        if (err) {
          console.error(err);
          res.render("login", { error: "An error occurred while processing your request" });
        } else if (results.length > 0) {
          // Managed to find user based on user ID, pass data as context to user view
          res.render("user", {username: results[0]['username'], password: results[0]['password'], email_address: results[0]['email']});
        } else {
          // If no matching user is found, render the login page with an error message
          res.render("login", { error: "An error occurred while processing your request" });
        }
      }
    );
    
  } else {
    res.redirect("/login?redirect_url=/user");
  }
});

/** App listening on port */
app.listen(port, () => {
  console.log(`MyBank app listening at http://localhost:${port}`);
});
