const ActivityLog = require("./activity-log.schema.js");

exports.create = async data => {
  const options = data?.session ? { session: data.session } : {};
  await new ActivityLog({
    author: data.author,
    username: data.username,
    activity: data.activity,
    resource: data.resource,
    dataId: data.dataId,
  }).save(options);
};

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.$or = [{ username: new RegExp(keyword, "i") }, { activity: new RegExp(keyword, "i") }];

  const countPromise = ActivityLog.countDocuments(filter);
  const activitiesPromise = ActivityLog.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).exec();

  const [count, activities] = await Promise.all([countPromise, activitiesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    activities,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_all_by_user = async (user, limit, page, offset) => {
  const filter = { deletedAt: null, author: user };

  const countPromise = ActivityLog.countDocuments(filter);
  const activitiesPromise = ActivityLog.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).exec();

  const [count, activities] = await Promise.all([countPromise, activitiesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    activities,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};
