import api from "./axios";

// ==========================================================
// REGISTER
// ==========================================================

export const registerUser = async (userData) => {
  const response = await api.post(
    "/register",
    userData
  );

  return response.data;
};

// ==========================================================
// LOGIN
// ==========================================================

export const loginUser = async (
  email,
  password
) => {
  const response = await api.post(
    "/login",
    {
      email,
      password,
    }
  );

  return response.data;
};

// ==========================================================
// LOGOUT
// ==========================================================

export const logoutUser = async () => {
  const response = await api.post(
    "/logout"
  );

  return response.data;
};

// ==========================================================
// FORGOT PASSWORD — SEND OTP
// ==========================================================

export const forgotPassword = async (
  email
) => {
  const response = await api.post(
    "/forgot-password",
    { email }
  );

  return response.data;
};

// ==========================================================
// FORGOT PASSWORD — VERIFY OTP
// ==========================================================

export const verifyOtp = async (
  email,
  otp
) => {
  const response = await api.post(
    "/verify-otp",
    {
      email,
      otp,
    }
  );

  return response.data;
};

// ==========================================================
// FORGOT PASSWORD — RESET PASSWORD
// ==========================================================

export const resetPassword = async (
  email,
  resetToken,
  password,
  passwordConfirmation
) => {
  const response = await api.post(
    "/reset-password",
    {
      email,
      reset_token: resetToken,
      password,
      password_confirmation: passwordConfirmation,
    }
  );

  return response.data;
};

// ==========================================================
// CHANGE PASSWORD (AUTHENTICATED)
// ==========================================================

export const changePassword = async ({
  current_password,
  new_password,
  new_password_confirmation,
}) => {
  const response = await api.put(
    "/profile/password",
    {
      current_password,
      new_password,
      new_password_confirmation,
    }
  );

  return response.data;
};
