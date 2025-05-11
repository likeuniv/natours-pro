/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable node/no-unsupported-features/es-syntax */
// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
   if (file.mimetype.startsWith('image')) {
      cb(null, true);
   } else {
      cb(new AppError('Not an image! Please upload only images.', 400), false);
   }
};

const upload = multer({
   storage: multerStorage,
   fileFilter: multerFilter,
});

//upload.single('image') - for single image - req.file
//upload.array('images',5) - for multiple with single field -req.files
//below is for mulitple files and multiple files as well
exports.uploadTourImages = upload.fields([
   {
      name: 'imageCover',
      maxCount: 1,
   },
   {
      name: 'images',
      maxCount: 3,
   },
]);

exports.resizeTourImages = async (req, res, next) => {
   if (!req.files.imageCover || !req.files.images) return next();

   //1- Process Cover image

   // const imageCoverFileName = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
   req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
   await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
   // req.body.imageCover = imageCoverFileName;

   //2-Images Process
   req.body.images = [];
   await Promise.all(
      req.files.images.map(async (file, i) => {
         const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

         await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${filename}`);

         req.body.images.push(filename);
      }),
   );

   // console.log(req.body);

   next();
};

// const tours = JSON.parse(
//    fs.readFileSync(`${__dirname}/../dev-data/data/tours.json`),
// );

/* exports.checkBodyMiddleware = (req, res, next) => {
   console.log(req.body);
   const obk = Object.keys(req.body);
   if (!(obk.includes('name') && obk.includes('price'))) {
      return res.status(400).json({
         status: 'fail',
         message: 'Bad Request',
      });
   }

   next();
}; */

/* exports.checkId = (req, res, next, val) => {
   if (!val) {
      //This actualy won't work here in my code as :id is alway need to sent to hit this server
      return res.status(404).json({
         status: 'fail',
         message: 'Invalid id',
      });
   }

   next();
}; */

exports.aliasTopTours = (req, res, next) => {
   req.query.limit = '5';
   req.query.sort = '-ratingsAverage,Price';
   req.query.fields = 'name,price,ratingsAverage,difficulty,duration';
   next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.deleteTour = factory.deleteOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.createTour = factory.createOne(Tour);

// exports.getAllTours = catchAsync(async (req, res, next) => {
//    //BUILD QUERY
//    //1a)Filtering
//    // const queryObj = { ...req.query };
//    // const exculdeFields = ['page', 'sort', 'limit', 'fields'];
//    // exculdeFields.forEach((el) => delete queryObj[el]);

//    //1b)advanced filtering
//    // let queryStr = JSON.stringify(queryObj);
//    // console.log(queryStr);
//    // queryStr = queryStr.replace(
//    //    /\b(gte|gt|lte|lt)\b/g,
//    //    (match) => `$${match}`,
//    // );

//    // console.log(JSON.parse(queryStr));

//    //{difficulty:'easy',duration:{$gte:5}}
//    //{ difficulty: 'easy', duration: { gte: '5' } }

//    // console.log(req.query, '\n', queryObj);

//    // let query = Tour.find(JSON.parse(queryStr));

//    //2)Sorting
//    // if (req.query.sort) {
//    //    const sortBy = req.query.sort.split(',').join(' ');

//    //    query = query.sort(sortBy);
//    //query.sort('price ratingAverage') - for sorting by multiple columns in mongoose
//    // } else {
//    //DEFAULT SORT
//    //    query = query.sort('-createdAt');
//    // }

//    //3)Field Limiting
//    // if (req.query.fields) {
//    //    const fields = req.query.fields.split(',').join(' ');
//    //    query = query.select(fields);
//    // } else {
//    //    query = query.select('-__v');
//    // }

//    //4)Pagination
//    // const page = req.query.page * 1 || 1; //DEFAULT - 1
//    // const limit = req.query.limit * 1 || 100; // DEFAULT - 100
//    // const skip = (page - 1) * limit;
//    // console.log(`${page} ${limit} ${skip}`);

//    // query = query.skip(skip).limit(limit);

//    // if (req.query.page) {
//    //    const numTours = await Tour.countDocuments();
//    //    const noOfpages = Math.floor(numTours / limit);
//    //    if (skip >= numTours) {
//    //       throw new Error('This page does not exist');
//    //    }
//    // }

//    // const query = await Tour.find()
//    //    .where('duration')
//    //    .equals(7)
//    //    .where('difficulty')
//    //    .equals('medium');

//    //EXECUTE QUERY
//    //console.log(new APIFeatures(Tour.find(), req.query));

//    const features = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();
//    //console.log(features);

//    const tours = await features.query; //featrues.query is member of the apiFeatures class\
//    //console.log(features);

//    //query.sort().select().skip().limit();

//    res.status(200).json({
//       staus: 'success',
//       results: tours.length,
//       data: {
//          tours,
//       },
//    });
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//    const tour = await Tour.findById(req.params.id).populate('reviews');
//    //Tour.findOne({_id:req.params.id})

//    if (!tour) {
//       return next(new AppError('Not tour found with given ID', 404));
//    }

//    res.status(200).json({
//       staus: 'success',
//       data: {
//          tour,
//       },
//    });

//    /*console.log(req.params);
//    const tour = tours.find((t) => t._id === req.params.id);

//    if (tour) {
//       res.status(200).json({
//          staus: 'success',
//          data: {
//             tour,
//          },
//       });
//    } else {
//       res.status(404).json({
//          staus: 'fail',
//          message: 'Invalid ID',
//       });
//    } */
// });

// exports.createTour = catchAsync(async (req, res, next) => {
//    /* console.log(req.body);
//    const toursLength = tours.length - 1;
//    //error over this as the tours file is missing the id field instead has _id
//    const newId = tours[toursLength] + 1;
//    // eslint-disable-next-line node/no-unsupported-features/es-syntax
//    const newTour = { id: newId, ...req.body };
//    tours.push(newTour);
//    fs.writeFile(
//       `${__dirname}/dev-data/data/tours.json`,
//       JSON.stringify(tours),
//       // eslint-disable-next-line no-unused-vars
//       (err) => {
//          res.status(201).json({
//             status: 'created',
//             data: {
//                tours: newTour,
//             },
//          });
//       },
//    );
//    //res.send('Done!'); */

//    //-----------------------------------------

//    // const newTour = new Tour();
//    // newTour.save();

//    const newTour = await Tour.create(req.body);

//    res.status(200).json({
//       staus: 'success',
//       data: {
//          tour: newTour,
//       },
//    });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//    });

//    if (!tour) {
//       return next(new AppError('Not tour found with given ID', 404));
//    }

//    res.status(200).json({
//       status: 'success',
//       data: {
//          tour,
//       },
//    });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//    const tour = await Tour.findByIdAndDelete(req.params.id);

//    if (!tour) {
//       return next(new AppError('Not tour found with given ID', 404));
//    }

//    res.status(204).json({
//       status: 'success',
//       data: null,
//    });
// });

exports.getTourStats = catchAsync(async (req, res) => {
   const stats = await Tour.aggregate([
      {
         $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
         $group: {
            _id: { $toUpper: '$difficulty' },
            // _id: '$ratingsAverage',
            // _id: null,
            num: { $sum: 1 },
            avgRating: { $avg: '$ratingsAverage' },
            noOfRatings: { $sum: '$ratingsQuantity' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
         },
      },
      {
         $sort: { avgPrice: 1 }, //1 for ASC & -1 for DESC
      },
      // {
      //    $match: { _id: { $ne: 'EASY' } },
      // },
   ]);

   res.status(200).json({
      status: 'success',
      data: {
         stats,
      },
   });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
   const year = +req.params.year; //2021

   const plan = await Tour.aggregate([
      {
         $unwind: '$startDates',
      },
      {
         $match: {
            startDates: {
               $gte: new Date(`${year}-01-01`),
               $lte: new Date(`${year}-12-31`),
            },
         },
      },
      {
         $group: {
            _id: { $month: '$startDates' },
            numOfTours: { $sum: 1 },
            tours: { $push: '$name' },
         },
      },
      {
         $addFields: { month: '$_id' },
      },
      {
         $project: {
            _id: 0,
         },
      },
      {
         $sort: { numOfTours: -1 },
      },
      {
         $limit: 6,
      },
   ]);

   const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
   ];

   const planWithMonthNames = plan.map((i) => ({
      ...i,
      month: monthNames[i.month - 1],
   }));

   res.status(200).json({
      status: 'success',
      data: { plan: planWithMonthNames },
   });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.11349/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
   const { distance, latlng, unit } = req.params;

   if (unit !== 'mi' || unit !== 'km') {
      return next(
         new AppError(
            `Invalid unit value. Select 'mi' for miles or 'km' for kilometers`,
            400,
         ),
      );
   }

   const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
   const [lat, lng] = latlng.split(',');

   if (!lat || !lng) {
      return next(
         new AppError(
            'Please provide latitude and longitude in specified format(eg: lat,lng)',
            400,
         ),
      );
   }

   //console.log(distance, lat, lng, unit);

   const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
   });

   res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
         data: tours,
      },
   });
});

exports.getDistances = catchAsync(async (req, res, next) => {
   const { latlng, unit } = req.params;

   const [lat, lng] = latlng.split(',');

   if (unit !== 'mi' && unit !== 'km') {
      return next(
         new AppError(
            `Invalid unit value. Select 'mi' for miles or 'km' for kilometers`,
            400,
         ),
      );
   }

   const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

   if (!lat || !lng) {
      return next(
         new AppError(
            'Please provide latitude and longitude in specified format(eg: lat,lng)',
            400,
         ),
      );
   }

   const distances = await Tour.aggregate([
      {
         $geoNear: {
            near: {
               type: 'Point',
               coordinates: [lng * 1, lat * 1],
            },
            distanceField: 'distance', //default in meters
            distanceMultiplier: multiplier,
         },
      },
      {
         $project: {
            name: 1,
            distance: 1,
         },
      },
   ]);

   res.status(200).json({
      status: 'success',
      data: {
         data: distances,
      },
   });
});
