/* eslint-disable no-lonely-if */
const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
   const message = `Invalid ${err.path} : ${err.value}`;
   return new AppError(message, 400);
};

const handleDupilcateFieldsDB = (err) => {
   const message = `Dupilcate filed values : ${err.errmsg.match(/(["'])(\\?.)*?\1/)[0]}`;
   return new AppError(message, 400);
};

const handleValidatinErrorDB = (err) => {
   const errors = Object.values(err.errors).map((el) => el.message);
   const message = `Invalid input data. ${errors.join('. ')}`;
   return new AppError(message, 400);
};

const handleJWTError = () =>
   new AppError(`Invalid Token. Please login again.`, 401);

const handleJWTExpiredError = () =>
   new AppError('Your Token has been expired! Please login again.', 401);

const sendErrorDev = function (err, req, res) {
   if (req.originalUrl.startsWith('/api')) {
      //API RESPONSE
      res.status(err.statusCode).json({
         status: err.status,
         message: err.message,
         error: err,
         stack: err.stack,
      });
   } else {
      //WEBSITE RENDER RESPONSE
      res.status(err.statusCode).render('error', {
         title: 'OOPS!!!',
         msg: err.message,
      });
   }
};

const sendErrorProd = function (err, req, res) {
   if (req.originalUrl.startsWith('/api')) {
      //API RESPONSE
      //Operational, trusted error : send to client
      if (err.isOperational) {
         res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
         });
         //Unknown or other programming error : don't leak error to client
      } else {
         //1)Log Error
         //console.error('Error : ', err);

         //2)Send generic response
         res.status(500).json({
            staus: 'error',
            message: 'Something went wrong',
         });
      }
   } else {
      //WEBSITE RENDERED RESPONSE
      //Operational, trusted error : send to client
      if (err.isOperational) {
         res.status(err.statusCode).render('error', {
            title: 'OOPS!!!',
            msg: err.message,
         });
         //Unknown or other programming error : don't leak error to client
      } else {
         //1)Log Error
         //console.error('Error : ', err);

         //2)Send generic response
         res.status(err.statusCode).render('error', {
            title: 'OOPS!!!',
            msg: `Something went wrong`,
         });
      }
   }
};

module.exports = (err, req, res, next) => {
   err.statusCode = err.statusCode || 500;
   err.status = err.status || 'error';

   if (process.env.NODE_ENV === 'development') {
      sendErrorDev(err, req, res);
   } else if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      let error = { ...err };
      if (error.name === 'CastError') error = handleCastErrorDB(error);
      if (error.code === 11000) error = handleDupilcateFieldsDB(error);
      if (error.name === 'ValidationError')
         error = handleValidatinErrorDB(error);
      if (error.name === 'JsonWebTokenError') error = handleJWTError();
      if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
      sendErrorProd(error, req, res);
   }
};
