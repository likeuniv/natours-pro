/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
   try {
      const res = await axios({
         method: 'POST',
         url: '/api/v1/users/login',
         data: {
            email,
            password,
         },
      });

      if (res.data.status === 'success') {
         document.getElementById('email').value = '';
         document.getElementById('password').value = '';
         showAlert(
            'success',
            'Logged in successfully. Wait! while we redirecting you....',
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

export const logout = async () => {
   try {
      const res = await axios({
         method: 'GET',
         url: '/api/v1/users/logout',
      });

      if (res.data.status === 'success') {
         showAlert('success', 'Logged out.');
         location.reload(true); //true- ensures the logout is from server. Otherwise it loads data from cache
         location.assign('/');
      }
   } catch (err) {
      showAlert('error', 'Error logging out! Try again.');
   }
};
