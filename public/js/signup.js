import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
   try {
      const res = await axios({
         method: 'POST',
         url: '/api/v1/users/signup',
         data: {
            name,
            email,
            password,
            passwordConfirm,
         },
      });

      if (res.data.status === 'success') {
         document.getElementById('name').value = '';
         document.getElementById('email').value = '';
         document.getElementById('password').value = '';
         document.getElementById('passwordConfirm').value = '';
         showAlert(
            'success',
            'Sign up success. Please wait we are redirecting you...',
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
