const config = require('./../config.json'); // load bot config
const mongoose = require("mongoose"); //database library
const Users = require("./../database/models/users.js"); // users model

module.exports = {
  name: "onDelete",
  async event(message) {
    return;
  },
};
