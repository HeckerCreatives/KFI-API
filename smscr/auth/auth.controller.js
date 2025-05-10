const passport = require("passport");
const { generateAccess } = require("../../configs/generate-token");

exports.login = (req, res) => {
  passport.authenticate("local", (err, user, info) => {
    console.log(err);
    if (err) return res.status(500).json({ success: false, msg: info, data: err });
    if (!user) return res.status(401).json({ success: false, msg: info.message });
    if (user.deletedAt) return res.status(403).json({ success: false, msg: "Invalid credentials" });
    const access = generateAccess(user);
    return res.status(200).json({ success: true, access: access.access });
  })(req, res);
};
