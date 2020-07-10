const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieSession({
  name: 'session',
  keys: ['userId']
}));
app.use(morgan('dev'));
app.set('view engine', 'ejs');

const {verifyShortUrl, randomString, checkIfAvail, addUser, fetchUserInfo, currentUser, urlsForUser, checkOwner} = require('./helperFunctions');

const urlDatabase = {
};

const userDatabase = {
  'abcd': {id: 'abcd', 'email': 'john@stamos.com', password: '1234'},
};

app.get('/', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/register', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (user) {
    res.redirect('/urls');
  } else {
    let templateVars = { currentUser: user };
    res.render('urls_register', templateVars);
  }
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;
  if (email === '') {
    res.status(400).send('Email is required');
  } else if (password === '') {
    res.status(400).send('Password is required');
  } else if (!checkIfAvail(email, userDatabase)) {
    res.status(400).send('This email is already registered');
  } else {
    const newUser = addUser(req.body, userDatabase);
    req.session.userId = newUser.id;
    res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (user) {
    res.redirect('/urls');
  } else {
    let templateVars = { currentUser: user };
    res.render('login', templateVars);
  }
});

app.post('/login', (req, res) => {
  const emailUsed = req.body['email'];
  const pwdUsed = req.body['password'];
  if (fetchUserInfo(emailUsed, userDatabase)) {
    const { password, id } = fetchUserInfo(emailUsed, userDatabase);
    if (!bcrypt.compareSync(pwdUsed, password)) {
      res.status(403).send('Error 403... re-enter your password');
    } else {
      req.session.userId = id;
      res.redirect('/urls');
    }
  } else {
    res.status(403).send('Error 403... email not found');
  }
});

app.get('/urls', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.render('urls_errors');
  } else {
    const usersLinks = urlsForUser(user, urlDatabase);
    let templateVars = { urls: usersLinks, currentUser: currentUser(req.session.userId, userDatabase) };
    res.render('urls_index', templateVars);
  }
});

app.post('/urls', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.redirect('/login');
  } else {
    const shortURL = randomString();
    const newURL = req.body.longURL;
    urlDatabase[shortURL] = { longURL: newURL, userID: user };
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get('/urls/new', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.redirect('/login');
  } else {
    let templateVars = { currentUser: user };
    res.render('urls_new', templateVars);
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const user = currentUser(req.session.userId, userDatabase);
  if (verifyShortUrl(shortURL, urlDatabase)) {
    if (user !== urlDatabase[shortURL].userID) {
      res.send('This id does not belong to you');
    } else {
      const longURL = urlDatabase[shortURL].longURL;
      let templateVars = { shortURL: shortURL, longURL: longURL, currentUser: user};
      res.render('urls_show', templateVars);
    }
  } else {
    res.send('This url does not exist');
  }
});

app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  if (verifyShortUrl(shortURL, urlDatabase)) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send('Does not exist');
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!checkOwner(currentUser(req.session.userId, userDatabase), req.params.shortURL, urlDatabase)) {
    res.send('This id does not belong to you');
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

app.post('/urls/:shortURL/edit', (req, res) => {
  if (!checkOwner(currentUser(req.session.userId, userDatabase), req.params.shortURL, urlDatabase)) {
    res.send('This id does not belong to you');
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});