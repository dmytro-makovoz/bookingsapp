// Token validation utilities
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // Decode JWT payload (second part of the token)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired (exp is in seconds)
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // If can't parse, consider expired
  }
};

export const getTokenInfo = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.id,
      exp: payload.exp,
      iat: payload.iat,
      isExpired: payload.exp < Date.now() / 1000
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return false;
  }
  
  return !isTokenExpired(token);
}; 