const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookie = require('cookie-parser');
const morgan = require('morgan');

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', "ejs");
app.use(cookie());
app.use(morgan('dev'));

const {verifyShortUrl, randomString, checkIfAvail, addUser, fetchUserInfo, currentUser, urlsForUser} = require('./helperFunctions');

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "nat123"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "nat123"
}

//store user as key object
const userDatabase = {
  "nat123": {id: "nat123", "email-address": "natalia.yuzhakova@com", password: "nat123"},
}

app.get("/", (req, res) => {
  res.send("Hello!");
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// registration form
app.get("/register", (req, res) => {
  templateVars = { current_user: currentUser(req.cookies['user_id'], userDatabase)}
  res.render("urls_register", templateVars);
})

app.post("/register", (req, res) => {
  const {password} = req.body;
  const email = req.body['email-address']
  if (email === '') {
    res.status(400).send('Email is required');
  } else if (password === '') {
    res.status(400).send('Password is required');
  } else if (!checkIfAvail(email, userDatabase)) {
    res.status(400).send('This email is already registered');
  } else {
  const newUser = addUser(req.body, userDatabase)
  res.cookie('user_id', newUser.id)
  res.redirect('/urls');
  }
})

app.get("/login", (req, res) => {
  templateVars = { current_user: currentUser(req.cookies['user_id'], userDatabase) }
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const emailUsed = req.body['email-address'];
  const pwdUsed = req.body['password'];
  if (fetchUserInfo(emailUsed, userDatabase)) {
    const password = fetchUserInfo(emailUsed, userDatabase).password;
    const id = fetchUserInfo(emailUsed, userDatabase).id;
    if (password !== pwdUsed) {
      res.status(403).send('Error 403... re-enter your password')
    } else {
      res.cookie('user_id', id);
      res.redirect('/urls');
    }
  } else {
    res.status(403).send('Error 403... email not found')
  }
});

// all urls are displayed on the main page
app.get("/urls", (req, res) => {
  const current_user = currentUser(req.cookies['user.id'], userDatabase);
  if (!current_user) {
    res.send("<html><body>Please sign in or register</body></html");
  }
  const userLinks = urlsForUser(current_user, urlDatabase);
  let templateVars = { urls: urlDatabase, current_user: currentUser(req.cookies['user_id'], userDatabase) };
  res.render("urls_index", templateVars);
});

//this is to add new url to all urls page
app.post("/urls", (req, res) => {
  const shortURL = randomString();
  const newURL = req.body.longURL;
  const user = currentUser(req.cookie['user_id'], userDatabase);
  urlDatabase[shortURL] = { longURL: newURL, userID: user};
  res.redirect(`/urls/${shortURL}`);
});

// new url key is created
app.get("/urls/new", (req, res) => {
  const current_user = currentUser(req.cookies['user_id'], userDatabase);
  if (!current_user) {
    res.redirect('/login');
  }
  let templateVars = { current_user: current_user };
  res.render("urls_new", templateVars);
});

// new page is shown
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const current_user = currentUser(req.cookies['user_id'], userDatabase);
  if (!urlDatabase[shortURL]) {
    res.send("The link does not exist");
  } else if (current_user !== urlDatabase[shortURL].userID) {
    res.send('This id does not belong to you');
    }
  if (verifyShortUrl(shortURL, urlDatabase)) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    let templateVars = { shortURL: shortURL, longURL: longURL, current_user: currentUser(req.cookies['user_id'], userDatabase)};
    res.render("urls_show", templateVars);
  } else {
    res.send('does not exist');
  }
});

// redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (verifyShortUrl(shortURL, urlDatabase)) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404);
    res.send('Does not exist');
  }
});

//this is to delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  const current_user = currentUser(req.cookies['user_id'], userDatabase);
  const shortURL = req.params.shortURL;
  if (current_user !== urlDatabase[shortURL].userID) {
    res.send('This id does not belong to you');
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

//this is to edit
app.post("/urls/:shortURL/edit", (req, res) => {
  if (!checkOwner(currentUser(req.cookies['user_id'], userDatabase), req.params.shortURL, urlDatabase)) {
    res.send('This id does not belong to you')
  }
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect('/urls')
});

const checkOwner = (userId, urlID, database) => {
  console.log('this is shortURL', urlID)
  return userId === database[urlID].userID
}

// endpoint to logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});