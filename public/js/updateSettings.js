/* eslint-disable */
//update data

import axios from 'axios';
import { showAlert } from './alerts';

//type is either password or userdata
export const userUpdate = async (data, type) => {
   try {
      const url = `/api/v1/users/${type === 'password' ? 'updatePassword' : 'updateMe'}`;

      const res = await axios({
         method: 'PATCH',
         url,
         data,
      });

      if (res.data.status === 'success') {
         showAlert('success', `${type.toUpperCase()} UPDATED!!`);
      }
   } catch (error) {
      showAlert('error', error.response.data.message);
   }
};
