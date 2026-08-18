const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  res.json(await authService.me(req.user.id));
});

const updateProfile = asyncHandler(async (req, res) => {
  res.json(await authService.updateProfile(req.user.id, req.body));
});

const changePassword = asyncHandler(async (req, res) => {
  res.json(await authService.changePassword(req.user.id, req.body));
});

const forgotPassword = asyncHandler(async (req, res) => {
  res.json(await authService.requestPasswordReset(req.body));
});

const resetPassword = asyncHandler(async (req, res) => {
  res.json(await authService.resetPassword(req.body));
});

module.exports = {
  signup,
  login,
  me,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
