import axios from 'axios';

const api = axios.create({
  // we have to set the same IP as env in API
  // baseURL: 'http://192.168.15.17:3333',
  // http://10.0.2.2:3333
  baseURL: 'http://192.168.1.8:3333',
});

export default api;
