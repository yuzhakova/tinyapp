const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.set('view engine', "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['userId']
}));

const {verifyShortUrl, randomString, checkIfAvail, addUser, fetchUserInfo, currentUser, urlsForUser, checkOwner} = require('./helperFunctions');

const urlDatabase = {
  // "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "nat123"},
  // "9sm5xK": {longURL: "http://www.google.com", userID: "nat123"
}

//store user as key object
const userDatabase = {
  // "abcd": {id: "abcd", "email": "john@stamos.com", password: "1234"},
};

app.get("/", (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// registration form
app.get("/register", (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (user) {
    res.redirect('/urls');
  } else {
    let templateVars = { currentUser: user };
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const {email, password} = req.body;
  if (email === '') {
    res.status(400).send('Email is required');
  } else if (password === '') {
    res.status(400).send('Password is required');
  } else if (!checkIfAvail(email, userDatabase)) {
    res.status(400).send('This email is already registered');
  } else {
  const newUser = addUser(req.body, userDatabase)
  req.session.userId = newUser.id;
  res.redirect('/urls');
  }
})

app.get("/login", (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (user) {
    res.redirect("/urls");
  } else {
    let templateVars = { currentUser: user };
    res.render("login", templateVars);
  }
});

//Create helper function to verify that the email and pwd match database
app.post("/login", (req, res) => {
  const emailUsed = req.body['email-address'];
  const pwdUsed = req.body['password'];
  if (fetchUserInfo(emailUsed, userDatabase)) {
    const { password, id } = fetchUserInfo(emailUsed, userDatabase);
    if (!bcrypt.compareSync(pwdUsed, password)) {
      res.status(403).send('Error 403... re-enter your password')
    } else {
      req.session.userId = id;
      res.redirect('/urls');
    }
  } else {
    res.status(403).send('Error 403... email not found')
  }
});

// all urls are displayed on the main page
app.get("/urls", (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.render("urls_errors");
    } else {
      const usersLinks = urlsForUser(user, urlDatabase);
      let templateVars = { urls: usersLinks, currentUser: currentUser(req.session.userId, userDatabase) };
      res.render("urls_index", templateVars);
  }
});

//this is to add new url to all urls page
app.post("/urls", (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.redirect("/login");
  } else {
    const shortURL = randomString();
    const newURL = req.body.longURL;
    urlDatabase[shortURL] = { longURL: newURL, userID: user };
    res.redirect(`/urls/${shortURL}`);
  }
});

// new url key is created
app.get("/urls/new", (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.redirect('/login');
  } else {
    let templateVars = { currentUser: user };
    res.render("urls_new", templateVars);
  }
});

// new page is shown
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const user = currentUser(req.session.userId, userDatabase);
  if (verifyShortUrl(shortURL, urlDatabase)) {
    if (user !== urlDatabase[shortURL].userID) {
      res.send('This id does not belong to you');
  } else {
    const longURL = urlDatabase[shortURL].longURL;
    let templateVars = { shortURL: shortURL, longURL: longURL, currentUser: user};
    res.render("urls_show", templateVars);
  }
} else {
  res.send('This url does not exist');
  }  
});

// redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (verifyShortUrl(shortURL, urlDatabase)) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send('Does not exist');
  }
});

//this is to delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!checkOwner(currentUser(req.session.userId, userDatabase), req.params.shortURL, urlDatabase)) {
    res.send('This id does not belong to you');
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

//this is to edit
app.post("/urls/:shortURL/edit", (req, res) => {
  if (!checkOwner(currentUser(req.session.userId, userDatabase), req.params.shortURL, urlDatabase)) {
    res.send('This id does not belong to you');
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
    }
});


// endpoint to logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});