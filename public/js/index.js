/* eslint-disable */

import '@babel/polyfill';
import { displayMap } from './mapBox';
import { login, logout } from './login';
import { signup } from './signup';
import { userUpdate } from './updateSettings';
import { forgetPassword, resetPassword } from './forgetPassword';

//DOM elements
const mapBox = document.getElementById('map');
const signupForm = document.querySelector('.form.sign-up');
const loginForm = document.querySelector('.form.log-in');
const userUpdateForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-settings');
const logoutBtn = document.querySelector('.nav__el--logout');
const forgetPasswordForm = document.querySelector('.forget-password');
const resetPasswordForm = document.querySelector('.reset-password-form');

//DELEGATION
if (mapBox) {
   const locations = JSON.parse(
      document.getElementById('map').dataset.locations,
   );
   displayMap(locations);
}

if (signupForm) {
   signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;
      if (password !== passwordConfirm) {
         return alert("Password doesn't matched");
      }
      signup(name, email, password, passwordConfirm);
   });
}

if (loginForm) {
   loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      login(email, password);
   });
}

if (userUpdateForm) {
   userUpdateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData();
      form.append('name', document.getElementById('name').value);
      form.append('email', document.getElementById('email').value);
      form.append('photo', document.getElementById('photo').files[0]);
      userUpdate(form, 'data');
   });
}

if (userPasswordForm) {
   userPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSave = document.querySelector('.btn--save-password');
      btnSave.disabled = true;
      btnSave.textContent = 'Updating...';

      const passwordCurrent = document.getElementById('password-current').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('password-confirm').value;
      await userUpdate(
         { passwordCurrent, password, passwordConfirm },
         'password',
      );

      btnSave.textContent = 'Save password';
      btnSave.disabled = false;
      document.getElementById('password-current').value = '';
      document.getElementById('password').value = '';
      document.getElementById('password-confirm').value = '';
   });
}

if (logoutBtn) {
   logoutBtn.addEventListener('click', logout);
}

if (forgetPasswordForm) {
   forgetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnFP = document.querySelector('.btn--forget-password');
      btnFP.disabled = true;
      btnFP.textContent = 'Sending mail...';

      const email = document.getElementById('email').value;
      document.getElementById('email').disabled = true;
      try {
         await forgetPassword(email);
      } finally {
         document.getElementById('email').value = '';

         document.getElementById('email').disabled = false;
         btnFP.textContent = 'Reset Password';
         btnFP.disabled = false;
      }
   });
}

if (resetPasswordForm) {
   resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = window.location.href;
      const token = url.split('/').pop();
      const btnRP = document.querySelector('.btn--reset-password');
      btnRP.disabled = true;
      btnRP.textContent = 'Processing...';

      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;
      try {
         await resetPassword(password, passwordConfirm, token);
      } finally {
         document.getElementById('password').value = '';
         document.getElementById('passwordConfirm').value = '';

         btnRP.textContent = 'Reset Password';
         btnRP.disabled = false;
      }
   });
}
