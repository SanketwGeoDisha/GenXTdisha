import axios from 'axios';

// Use relative URL for Vercel deployment, absolute for local development
const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkStatus = async () => {
    try {
        const response = await api.get('/');
        return response.data;
    } catch (error) {
        console.error("API Status Check Failed:", error);
        throw error;
    }
};

export const generateReport = async (collegeName) => {
  try {
    const response = await api.post('/generate-college-report', {
      college_name: collegeName,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export default api;
