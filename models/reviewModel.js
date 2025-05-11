const mongoose = require('mongoose');
const Tour = require('./tourModel');

//review/rating/createdAt/ref to tour/ref to User
const reviewSchema = new mongoose.Schema(
   {
      review: {
         type: String,
         required: [true, 'Review cannot be empty.'],
      },
      rating: {
         type: Number,
         min: 1,
         max: 5,
      },
      createdAt: {
         type: Date,
         default: Date.now,
      },
      tour: {
         type: mongoose.Schema.ObjectId,
         ref: 'Tour',
         required: [true, 'Review mnust belong to a tour.'],
      },
      user: {
         type: mongoose.Schema.ObjectId,
         ref: 'User',
         required: [true, 'Review must belong to a user.'],
      },
   },
   {
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   },
);

reviewSchema.pre(/^find/, function (next) {
   // this.populate({
   //    path: 'tour',
   //    select: 'name',
   // }).populate({
   //    path: 'user',
   //    select: 'name photo',
   // });

   this.populate({
      path: 'user',
      select: 'name photo',
   });

   next();
});

//This helps to prevent creating duplicate review on a tour by the user
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function (tourId) {
   const stats = await this.aggregate([
      {
         $match: { tour: tourId },
      },
      {
         $group: {
            _id: '$tour',
            nRatings: { $sum: 1 },
            avgRatings: { $avg: '$rating' },
         },
      },
   ]);

   // console.log(stats);

   if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
         ratingsQuantity: stats[0].nRatings,
         ratingsAverage: stats[0].avgRatings,
      });
   } else {
      await Tour.findByIdAndUpdate(tourId, {
         ratingsQuantity: 0,
         ratingsAverage: 4.5,
      });
   }
};

reviewSchema.post('save', function () {
   //this points to current review
   this.constructor.calcAverageRatings(this.tour);
   //post don't have access to next
});

//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
   this.r = await this.findOne();
   //post has no access to query
   // console.log(r);
   next();
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
   //await this.findOne(); does not work here, query is already been executed
   await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
