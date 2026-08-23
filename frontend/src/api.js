import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function unwrap(promise) {
  return promise.then((res) => res.data).catch((err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    throw new Error(message);
  });
}

export const api = {
  register: (payload) => unwrap(client.post('/auth/register', payload)),
  login: (payload) => unwrap(client.post('/auth/login', payload)),

  issueCredential: (payload) => unwrap(client.post('/credentials', payload)),
  listCredentials: () => unwrap(client.get('/credentials')),
  getCredentialQr: (credentialId) => unwrap(client.get(`/credentials/${credentialId}/qr`)),
  revokeCredential: (credentialId, reason) =>
    unwrap(client.post(`/credentials/${credentialId}/revoke`, { reason })),

  validateBulkCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrap(client.post('/credentials/bulk/validate', formData));
  },
  commitBulkIssue: (rows) => unwrap(client.post('/credentials/bulk/commit', { rows })),

  verifyByCredentialId: (credentialId) => unwrap(client.get(`/verify/${credentialId}`)),
  verifyByHash: (hash) => unwrap(client.get(`/verify/hash/${hash}`)),
  tamperCheck: (credentialId, fields) => unwrap(client.post(`/verify/${credentialId}/tamper-check`, fields)),
  verifyBulk: (queries) => unwrap(client.post('/verify/bulk', { queries })),
  verifyBulkFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return unwrap(client.post('/verify/bulk/file', formData));
  },
};

export default api;
