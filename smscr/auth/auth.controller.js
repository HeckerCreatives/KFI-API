const passport = require("passport");
const { generateAccess } = require("../../configs/generate-token");
const loginLogService = require("../login-logs/login-log.service.js");

exports.login = (req, res) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) return res.status(500).json({ success: false, msg: info, data: err });
    if (!user) return res.status(401).json({ success: false, msg: info.message });

    if (user.status === "banned" || user.status === "inactive") return res.status(403).json({ success: false, msg: "This account has been suspended." });

    if (user.deletedAt) return res.status(403).json({ success: false, msg: "Invalid credentials" });

    if (user.role !== "superadmin" && user.platform !== req.body.deviceType) {
      return res.status(403).json({ success: false, msg: "Your account doesn't have an access to this device" });
    }

    if (user.role !== "superadmin" && user.permissions.map(permission => permission.actions.visible).every(e => e === false)) {
      return res.status(403).json({ success: false, msg: "Your account doesn't have an access to any page" });
    }

    const access = generateAccess(user);

    await loginLogService.create(user._id, req.body.deviceName);

    return res.status(200).json({ success: true, access: access.access });
  })(req, res);
};
