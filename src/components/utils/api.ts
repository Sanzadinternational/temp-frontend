import { getToken } from "./auth";

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getToken();

  if (!token) {
    throw new Error("User is not authenticated");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized - please log in again");
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};