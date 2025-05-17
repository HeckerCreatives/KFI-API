const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const userService = require("./user.service.js");

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedSort = ["name-asc", "name-desc", "user-asc", "user-desc"].includes(sort) ? sort : "";
    const result = await userService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null, role: "user" };
    const result = await userService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const result = await userService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updatePermissions = async (req, res, next) => {
  try {
    const result = await userService.update_permissions(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.banUsers = async (req, res, next) => {
  try {
    const result = await userService.ban_users(req.body, "banned");
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.unbannedUsers = async (req, res, next) => {
  try {
    const result = await userService.ban_users(req.body, "active");
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const result = await userService.change_password(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await userService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
