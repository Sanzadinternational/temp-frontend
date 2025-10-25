export const getToken = () => localStorage.getItem("authToken");

export const removeToken = () => {
  localStorage.removeItem("authToken");
};

export const isLoggedIn = () => !!getToken();