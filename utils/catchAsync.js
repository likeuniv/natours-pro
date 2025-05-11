// eslint-disable-next-line arrow-body-style
module.exports = (fn) => {
   //the function that is returned is one that is called by express
   return (req, res, next) => {
      //As this is a async function, it returns promise and catch if any error and propagates to err middleware
      fn(req, res, next).catch((err) => next(err)); //'fn' has accessed here because of closures.
   };
};
