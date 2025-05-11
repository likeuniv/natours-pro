const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
   //1- Get all the tour data from collection
   const tours = await Tour.find();

   //2- Build template

   //3- Render that template using tour data from 1
   res.status(200).render('overview', {
      title: 'All Tours',
      tours,
   });
});

exports.getTour = catchAsync(async (req, res, next) => {
   //1- Get data for the requested tour (including reviews and tour guides)
   const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
   });

   if (!tour) {
      return next(new AppError('There is no with that name.', 404));
   }

   //2- Build template

   //3- Render template using the data from 1
   res.status(200)
      .set(
         'Content-Security-Policy',
         "connect-src 'self' http://127.0.0.1:8000/ https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com ws://localhost:1234/",
      )
      .render('tour', {
         title: tour.name,
         tour,
      });
});

exports.getLoginForm = (req, res, next) => {
   res.status(200)
      .set(
         'Content-Security-Policy',
         "connect-src 'self' http://127.0.0.1:8000/",
      )
      .render('login', {
         title: 'Login',
      });
};

exports.getSignupForm = (req, res, next) => {
   res.status(200)
      .set(
         'Content-Security-Policy',
         "connect-src 'self' http://127.0.0.1:8000/",
      )
      .render('signup', {
         title: 'Sign up',
      });
};

exports.getAccount = (req, res, next) => {
   res.status(200).render('account', {
      title: 'Account',
   });
};

exports.updateUserData = catchAsync(async (req, res) => {
   // console.log(req.body);
   // console.log(req.params);
   const userUpdated = await User.findByIdAndUpdate(
      req.user.id,
      {
         name: req.body.name,
         email: req.body.email,
      },
      {
         new: true,
         runValidators: true,
      },
   );

   res.status(200).render('account', {
      title: 'Account',
      user: userUpdated,
   });
});

//By me
exports.getForgetPasswordForm = (req, res, next) => {
   res.status(200)
      .set(
         'Content-Security-Policy',
         "connect-src 'self' http://127.0.0.1:8000/",
      )
      .render('forgetPassword', {
         title: 'Forget Password',
      });
};

exports.getResetPasswordForm = (req, res, next) => {
   res.status(200)
      .set(
         'Content-Security-Policy',
         "connect-src 'self' http://127.0.0.1:8000/",
      )
      .render('resetPassword', {
         title: 'Reset Password',
      });
};
