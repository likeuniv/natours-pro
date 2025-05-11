const express = require('express');
const viewsController = require('../controllers/viewsController');
const authConroller = require('../controllers/authController');

const router = express.Router();

// router.use(authConroller.isLoggedIn);

router.get('/', authConroller.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authConroller.isLoggedIn, viewsController.getTour);
router.get('/login', authConroller.isLoggedIn, viewsController.getLoginForm);
router.get('/signup', authConroller.isLoggedIn, viewsController.getSignupForm);
router.get(
   '/forgetPassword',
   authConroller.isLoggedIn,
   viewsController.getForgetPasswordForm,
);
router.get(
   '/resetPassword/:resetToken',
   authConroller.isLoggedIn,
   viewsController.getResetPasswordForm,
);
router.get('/me', authConroller.protect, viewsController.getAccount);

router.post(
   '/submit-user-data',
   authConroller.protect,
   viewsController.updateUserData,
);

module.exports = router;
