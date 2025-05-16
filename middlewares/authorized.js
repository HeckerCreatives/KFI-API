const mongoose = require("mongoose");
const User = require("../smscr/user/user.schema");
const { getToken } = require("../utils/get-token");

exports.isAuthorize = (role, resource, action) => {
  return async (req, res, next) => {
    const token = getToken(req);

    next();
  };
};
