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
  for (user in database) {
    if (database[user]['email-address'] === newVal) {
      return false;
    }
  }
  return true;
}

//helper function: add user if available
const addUser = (newUser, database) => {
  const newUserId = randomString();
  newUser.id = newUserId;
  userDatabase[newUserId] = newUser;
  return newUser;
}

const fetchUserInfo = (email, database) => {
  for (key in database) {
    if (database[key]['email-address'] === email) {
      return database[key]
    }
  }
}



module.exports = { verifyShortUrl, randomString, checkIfAvail, addUser, fetchUserInfo } 