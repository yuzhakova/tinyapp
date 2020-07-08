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


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// all urls are displayed on the main page
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies['username'] };
  res.render("urls_index", templateVars);
});

// new url is created
app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies['username']}
  res.render("urls_new", templateVars);
});

// new page is shown
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (verifyShortUrl(shortURL)) {
    let longURL = urlDatabase[req.params.shortURL];
    let templateVars = { shortURL: shortURL, longURL: longURL, username: req.cookies['username']
};
    res.render("urls_show", templateVars);
  } else {
    res.send('does not exist');
  }
});

// new url is added to be shown with all urls
app.post("/urls", (req, res) => {
  const shortURL = generateShortURL();
  const newURL = req.body.longURL;
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});

// redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (verifyShortUrl(shortURL)) {
    const longURL = urlDatabase[shortURL];
    res.redirect(longURL);
  } else {
    res.status(404);
    res.send('Does not exist');
  }
});

//this is to handle post requests on the server (delete url)
//post route that removes a url resource: POST
app.post("/urls/:shortURL/delete", (req, res) => {
  const urlToDelete = req.params.shortURL;
  delete urlDatabase[urlToDelete];
  res.redirect('/urls');
});

//this is to edit
app.post("/urls/:shortURL/edit", (req, res) => {
  const key = req.params.shortURL;
  urlDatabase[key] = req.body.longURL;
  res.redirect('/urls')
});

// endpoint to login
app.post("/login", (req, res) => {
  if (req.body.username) {
    const username = req.body.username;
    res.cookie('username', username);
  }
  res.redirect('/urls');
});

// endpoint to logout
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  templateVars = { username:req.cookies['username']}
  res.render("urls_register", templateVars);
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//These are helper functions
// this will generate a unique url, string random alphaNumeric values
// index is betwen 0 and 61 as 62 is our alphaNumeric
const generateRandomString = () => {
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const upperCase = lowerCase.toUpperCase();
  const numeric = '1234567890';
  const alphaNumeric = lowerCase + upperCase + numeric;
  //alphaNumeric is 62
  let index = Math.round(Math.random() * 100);
  if (index > 61) {
    while (index > 61) {
      index = Math.round(Math.random() * 100);
    }
  }
  return alphaNumeric[index];
};

const generateShortURL = () => {
  let randomString = '';
  while (randomString.length < 6) {
    randomString += generateRandomString();
  }
  return randomString;
};

//this will show if short url exists
const verifyShortUrl = URL => {
  return urlDatabase[URL];
};