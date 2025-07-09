import axios from 'axios';
import { BASE_URL } from '../src/api';

export const saveOnboardingData = async (data) => {
  try {
    const res = await axios.post(`${BASE_URL}/onboarding/save`, data);
    return res.data;
  } catch (err) {
    console.error('Onboarding save error:', err);
    throw err;
  }
};
