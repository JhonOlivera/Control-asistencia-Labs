export const backendUrl =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : 'https://control-asistencia-api-e8u5.onrender.com';
export const apiUrl = `${backendUrl}/api`;
export const googleLoginUrl = `${backendUrl}/oauth2/authorization/google`;
