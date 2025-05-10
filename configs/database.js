const mongoose = require("mongoose");
const User = require("../smscr/user/user.schema");
const { su } = require("../constants/roles");

exports.database = () => {
  mongoose.set("strictQuery", true);
  mongoose.connect(process.env.ATLAS_URI, {});
  mongoose.connection.once("open", async () => {
    const suExists = await User.exists({ role: su, deletedAt: null });
    if (!suExists) {
      const superadmin = new User({
        name: "Super Admin",
        username: process.env.SU_USERNAME,
        password: process.env.SU_PASSWORD,
        role: su,
      });
      await superadmin.savePassword(process.env.SU_PASSWORD);
      await superadmin.save();
    }
    console.log("connection to database has been established.");
  });
};
