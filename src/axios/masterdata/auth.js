import axios from "axios";

const API_URL = "http://localhost:8000/api/auth/";

const register = (username, email, password1, password2) => {
  return axios.post(API_URL + "registration/", {
    username,
    email,
    password1,
    password2,
  });
};

const login = (username, password) => {
  return axios
    .post(API_URL + "login/", {
      username,
      password,
    })
    .then((response) => {
      if (response.data.key) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      return response.data;
    });
};

const logout = () => {
  localStorage.removeItem("user");
  return axios.post(API_URL + "logout/");
};

export default {
  register,
  login,
  logout,
};
