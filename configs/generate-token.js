const jwt = require("jsonwebtoken");

exports.generateAccess = user => {
  const duration = 7 * 24 * 60 * 60;
  const expiration = Date.now() + duration * 1000;
  return {
    access: jwt.sign({ _id: user._id, username: user.username, role: user.role }, process.env.ACCESS_JWT_SECRET, { algorithm: "HS256", expiresIn: duration }),
    expiration: new Date(expiration),
  };
};

exports.generateRefresh = user => {
  const duration = 24 * 60 * 60;
  const expiration = Date.now() + duration * 1000;
  return {
    refresh: jwt.sign({ username: user.username }, process.env.REFRESH_JWT_SECRET, { algorithm: "HS256", expiresIn: duration }),
    expiration: new Date(expiration),
  };
};
