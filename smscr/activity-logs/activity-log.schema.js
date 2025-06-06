const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: { type: String },
    activity: { type: String },
    action: { type: String },
    resource: { type: String },
    dataId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

module.exports = ActivityLog;
