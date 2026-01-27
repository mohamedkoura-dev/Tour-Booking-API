import axios from 'axios';
import { showAlert } from './alert';

//type is either password or data
export const updateSettings = async (data, type) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${type === 'data' ? 'updateMe' : 'updateMyPassword'}`,
      data,
    });
    if (res.data.status === 'success')
      showAlert('success', `${type.toUpperCase()} is updated successfully!`);
  } catch (error) {
    showAlert('error', error.response?.data?.message || 'Something went very wrong!');
  }
};
