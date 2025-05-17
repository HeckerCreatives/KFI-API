const User = require("../smscr/user/user.schema");
const { getToken } = require("../utils/get-token");
const { su } = require("../constants/roles");

exports.isAuthorize = (resource, action) => {
  return async (req, res, next) => {
    const token = getToken(req);
    const user = await User.findById(token._id).lean().exec();
    if (!user) return res.status(403).json({ msg: "Unauthorized" });
    if (user.status === "banned" || user.status === "inactive") return res.status(403).json({ msg: "Unauthorized" });
    if (user.role === su) return next();

    const permission = user.permissions.find(e => e.resource === resource);
    if (!permission) return res.status(403).json({ msg: "Unauthorized" });
    if (!permission.actions[`${action}`]) return res.status(403).json({ msg: "Unauthorized" });

    next();
  };
};
