const jwt = require("jsonwebtoken");

exports.getToken = req => jwt.decode(req.headers.authorization.split(" ")[1]);
