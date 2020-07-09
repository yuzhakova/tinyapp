const bcrypt = require('bcrypt');

//These are helper functions
//this will show if short url exists
const verifyShortUrl = (URL, database) => {
  return database[URL];
};

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


const randomString = () => {
  let randomString = '';
  while (randomString.length < 6) {
    randomString += generateRandomString
  }
  return randomString;
};

//helpfer function: to check if emails are registered
const checkIfAvail = (newVal, database) => {
  for (let user in database) {
    if (database[user].email === newVal) {
      return false;
    }
  }
  return true;
};

//helper function: add user if available
const addUser = (newUser, database) => {
  const newUserId = randomString();
  newUser.id = newUserId;
  newUser.password = bcrypt.hashSync(newUser.password, 10);
  database[newUserId] = newUser;
  return newUser;
}

const fetchUserInfo = (email, database) => {
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return undefined;
};

const currentUser = (cookie, database) => {
  for (let ids in database) {
    if (cookie === ids) {
      return database[ids].email;
    }
  }
};

//this is to return url where the userID is equal to the id of current user
const urlsForUser = (id, database) => {
  let currentUserId = id;
  let usersURLs = {};
  for (let key in database) {
    if (database[key].userID === currentUserId) {
      usersURLs[key] = database[key];
    }
  }
  return usersURLs;
};

const checkOwner = (userId, urlID, database) => {
  return userId === database[urlID].userID;
}

module.exports = {verifyShortUrl, randomString, checkIfAvail, addUser, fetchUserInfo, currentUser, urlsForUser, checkOwner};
