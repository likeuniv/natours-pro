/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const forgetPassword = async (email) => {
   try {
      const res = await axios({
         method: 'POST',
         url: '/api/v1/users/forgotPassword',
         data: {
            email,
         },
      });

      if (res.data.status === 'success') {
         showAlert(
            'success',
            'If password present in our database, you will receive a password reset email.',
         );
      }
   } catch (err) {
      // console.log(err);
      showAlert('error', err.response.data.message);
   }
};

export const resetPassword = async (password, passwordConfirm, resetToken) => {
   try {
      const res = await axios({
         method: 'PATCH',
         url: `/api/v1/users/resetPassword/${resetToken}`,
         data: {
            password,
            passwordConfirm,
         },
      });

      if (res.data.status === 'success') {
         showAlert(
            'success',
            'Password reset sucessful. Redirecting to home...',
         );
         window.setTimeout(() => {
            location.assign('/');
         }, 1000);
      }
   } catch (err) {
      // console.log(err);
      showAlert('error', err.response.data.message);
   }
};
