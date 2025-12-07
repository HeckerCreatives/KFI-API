const { su } = require("../constants/roles");
const User = require("../smscr/user/user.schema");
const { getToken } = require("./get-token");

exports.isSyncAuthorize = (resource, dataType) => {
  return async (req, res, next) => {
    const token = getToken(req);
    const user = await User.findById(token._id).lean().exec();
    if (!user) return res.status(403).json({ msg: "Unauthorized" });
    if (user.status === "banned" || user.status === "inactive") return res.status(403).json({ msg: "Unauthorized" });
    if (user.role === su) return next();

    const permission = user.permissions.find(e => e.resource === resource);

    if (!permission.actions.visible) return res.status(403).json({ msg: "Unauthorized" });
    if (!permission) return res.status(403).json({ msg: "Unauthorized" });

    const toCreate = req.body[dataType].filter(e => e.action === "create");
    const toUpdate = req.body[dataType].filter(e => e.action === "update");
    const toDelete = req.body[dataType].filter(e => e.action === "delete");

    if ((toCreate.length > 0 && !permission.actions.create) || (toUpdate.length > 0 && !permission.actions.update) || (toDelete.length > 0 && !permission.actions.delete)) {
      if (resource === "clients" && req.files && req.files.length > 0) await Promise.all(req.files.map(async file => await fs.promises.unlink(file.path)));
      return res.status(403).json({ msg: "Unauthorized" });
    }

    next();
  };
};
