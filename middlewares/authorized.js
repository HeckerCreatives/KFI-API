const mongoose = require("mongoose");
const User = require("../smscr/user/user.schema");
const { getToken } = require("../utils/get-token");

exports.isAuthorize = (roles = []) => {
  if (typeof roles === "string") roles = [roles];
  return async (req, res, next) => {
    const token = getToken(req);
    if (!mongoose.Types.ObjectId.isValid(token._id)) return res.status(403).json({ msg: "Forbidden" });
    const user = await User.findById(token._id).exec();
    if (!user) return res.status(403).json({ msg: "Forbidden" });
    if (user.status !== "active") return res.status(403).json({ msg: "Forbidden" });
    if (!roles.includes(user.role)) return res.status(403).json({ msg: "Forbidden" });

    next();
  };
};
