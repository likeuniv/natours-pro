/* eslint-disable arrow-body-style */
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
   return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
   });
};

const createAndSendToken = (user, statusCode, req, res) => {
   const token = signToken(user._id);

   //set in cookie
   const cookieOptions = {
      expires: new Date(
         Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
      ),
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
   };
   //if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //only works with https request
   //cookieOptions.secure = req.secure || req.headers('x-forwarded-proto') === 'https';

   res.cookie('jwt', token, cookieOptions);

   //Remove password from output
   user.password = undefined;

   res.status(statusCode).json({
      status: 'success',
      token,
      data: {
         user,
      },
   });
};

exports.signup = catchAsync(async (req, res, next) => {
   const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
   });

   //console.log(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);

   /* const token = signToken(newUser._id);

   res.status(201).json({
      status: 'success',
      token,
      data: {
         user: newUser,
      },
   }); */

   const url = `${req.protocol}://${req.get('host')}/me`;
   await new Email(newUser, url).sendWelcome();
   newUser.active = undefined;
   createAndSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
   const { email, password } = req.body;

   //1)check email and pwd are valid
   if (!email || !password) {
      return next(new AppError('Please provide email and password.'), 400);
   }
   //2)check if user exist && pwd is valid
   const user = await User.findOne({ email })
      .select('+password')
      .select('+active');
   //const correct = await user.correctPassword(password, user.password);
   // console.log(user);

   if (
      !user ||
      !(await user.correctPassword(password, user.password)) ||
      !user.active
   ) {
      return next(
         new AppError('Incorrect email or password/User Not available', 401),
      );
   }

   // user.active = undefined;
   //3)If everything is ok, send a token to client
   /* const token = signToken(user._id);

   res.status(200).json({
      status: 'success',
      message: 'Login success',
      token,
   }); */
   createAndSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
   res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
   });
   res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
   //1)Get the token and check if it exist
   let token;
   if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
   ) {
      token = req.headers.authorization.split(' ')[1];
   } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
   }

   if (!token) {
      return next(
         new AppError(
            'You are not logged in! Please login to get access.',
            401,
         ),
      );
   }

   //2)Verification of token
   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

   //3)check if user still exist
   const freshUser = await User.findById(decoded.id);
   if (!freshUser) {
      return next(
         new AppError("The user belong to this token does't exist"),
         401,
      );
   }

   //4)Check if user changed password after JWT is issued.
   if (freshUser.changesPasswordAfter(decoded.iat)) {
      return next(
         new AppError(
            'Users password recently changed! Please login again.',
            401,
         ),
      );
   }

   //GRANT ACCESS TO PROTECT ROUTE
   req.user = freshUser; //Can be used in another middleware function
   res.locals.user = freshUser;
   next();
});

//Only for renderd pages, no errors
exports.isLoggedIn = async (req, res, next) => {
   if (req.cookies.jwt) {
      try {
         //1- verifies token
         const decoded = await promisify(jwt.verify)(
            req.cookies.jwt,
            process.env.JWT_SECRET,
         );

         //2- check if user still exist
         const freshUser = await User.findById(decoded.id);
         if (!freshUser) {
            return next();
         }

         //3- Check if user changed password after JWT is issued.
         if (freshUser.changesPasswordAfter(decoded.iat)) {
            return next();
         }

         //THERE IS A LOGGED IN USER
         res.locals.user = freshUser;
         return next();
      } catch (err) {
         return next();
      }
   }
   next();
};

exports.restrictTo = (...roles) => {
   return (req, res, next) => {
      //roles ['admin', 'lead-guide']
      if (!roles.includes(req.user.role)) {
         //has access to 'roles' because of closure.
         return next(
            new AppError(
               `Insufficient permissions to perform this action.`,
               403,
            ),
         );
      }
      next();
   };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
   //1-Get user based on posted email
   const user = await User.findOne({ email: req.body.email });

   if (!user) {
      return next(
         new AppError('There is no user with the specified email', 404),
      );
   }
   //2-Generate the random user token
   const resetToken = user.createPasswordResetToken();
   await user.save({ validateBeforeSave: false });

   //Send it user email
   const resetURL = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`;

   //const message = `Forgot Password? Submit a Patch request with your password and Confirm password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email! Please note that this url is valid upto 10 minutes.\n\nRegards,\nNatours IT Team`;

   try {
      // await sendEmail({
      //    email: user.email,
      //    subject: `Password Reset`,
      //    message,
      // });

      await new Email(user, resetURL).sendPasswordReset();
   } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new AppError('Error sending email. Try again later.', 500));
   }

   res.status(200).json({
      status: `success`,
      message: 'Token sent successful!',
   });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
   //1-get user based on token
   const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

   const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
   });

   //2-If token has not expired and there is a user exist,set new password
   if (!user) {
      return next(new AppError('Token is invalid or has expired.', 400));
   }

   user.password = req.body.password;
   user.passwordConfirm = req.body.passwordConfirm;
   user.passwordResetToken = undefined;
   user.passwordResetExpires = undefined;
   await user.save();
   //3-update changedPasswordAt property for the user
   //4-Log the user in , send JWT
   /* const token = signToken(user._id);

   res.status(200).json({
      status: `success`,
      token,
   }); */
   createAndSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
   //1-get user from collection
   const user = await User.findById(req.user._id).select('+password');
   //2-check if posted current password is correct

   const passwordPosted = req.body.passwordCurrent;
   if (!(await user.correctPassword(passwordPosted, user.password))) {
      return next(new AppError('Incorrect current password.', 401));
   }
   //3-If so update password
   user.password = req.body.password;
   user.passwordConfirm = req.body.passwordConfirm;
   await user.save();
   //User.findByIdAndUpdate will not work as intended

   //4-Login user, send JWT
   /* const token = signToken(user.id);

   res.status(201).json({
      staus: 'success',
      token,
      data: {
         user,
      },
   }); */
   createAndSendToken(user, 201, req, res);
});
