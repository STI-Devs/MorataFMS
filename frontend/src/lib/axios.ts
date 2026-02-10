import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.API_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    withXSRFToken: true
});

export default api;
