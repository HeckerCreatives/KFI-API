const ActivityLog = require("./activity-log.schema.js");

exports.create = async data => {
  await new ActivityLog({
    author: data.author,
    username: data.username,
    activity: data.activity,
    resource: data.resource,
    dataId: data.dataId,
  }).save();
};
