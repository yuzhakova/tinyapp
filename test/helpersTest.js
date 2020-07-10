const { assert } = require('chai');
const { fetchUserInfo } = require('../helperFunctions');

//fetchUserInfo returns all user info based on email address

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    "email": "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    "email": "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const result = fetchUserInfo('user@example.com', testUsers);
    const expectedOutput = { id: "userRandomID", "email": "user@example.com", password: "purple-monkey-dinosaur" };
    assert.equal(result.id, expectedOutput.id);
    assert.equal(result.email, expectedOutput.email);
    assert.equal(result.password, expectedOutput.password);
  });

  it('should return a user with valid email', function() {
    const result = fetchUserInfo('user2@example.com', testUsers);
    const expectedOutput = { id: "user2RandomID", "email": "user2@example.com", password: "dishwasher-funk" };
    assert.equal(result.id, expectedOutput.id);
    assert.equal(result.email, expectedOutput.email);
    assert.equal(result.password, expectedOutput.password);
  });

  it('should return undefined with an invalid email', function() {
    const result = fetchUserInfo('user@example', testUsers);
    const expectedOutput = { id: "userRandomID", "email": "user@example.com", password: "purple-monkey-dinosaur" };
    assert.equal(result, undefined);
  });
});