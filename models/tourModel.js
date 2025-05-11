/* eslint-disable prefer-arrow-callback */
/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

//Schema
const tourSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: [true, 'A tour must have a name'],
         unique: true,
         trim: true,
         maxlength: [
            40,
            'A tour name must be less than or equal to 40 characters',
         ],
         minlength: [5, 'A tour name must be consist at least 5 characters'],
         /* validate: [
            validator.isAlpha,
            'Tour name must only contain characters',
         ], */
      },
      duration: {
         type: Number,
         required: [true, 'A tour must have duration'],
      },
      maxGroupSize: {
         type: Number,
         required: [true, 'A tour must have group size'],
      },
      difficulty: {
         type: String,
         required: [true, 'A tour must have difficulty level'],
         enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Choose only easy, medium or difficult',
         },
      },
      ratingsAverage: {
         type: Number,
         default: 4.5,
         min: [1, 'Rating should be atleast 1'],
         max: [5, 'Rating should not cross 5'],
         set: (val) => Math.round(val * 10) / 10, //4.66666 -> 46.6666 -> 47/10 -> 4.7 //set a callback function is called everytime a value to set
      },
      ratingsQuantity: {
         type: Number,
         default: 0,
      },
      price: {
         type: Number,
         required: [true, 'A tour must have a price'],
      },
      priceDiscount: {
         type: Number,
         validate: {
            validator: function (value) {
               //custom validator & this keyword here points to current doc on NEW document creation but not on update
               return value < this.price;
            },
            message:
               'Discount price ({VALUE}) should not exceed the actual price.',
         },
      },
      summary: {
         type: String,
         trim: true,
         required: [true, 'A tour must have a summary'],
      },
      description: {
         type: String,
         trim: true,
      },
      imageCover: {
         type: String,
         required: [true, 'A tour must have a cover image'],
      },
      slug: [String],
      images: [String],
      createdAt: {
         type: Date,
         default: Date.now(),
         select: false, //to exculde it in the output for eg: password
      },
      startDates: [Date],
      secretTour: {
         type: Boolean,
         default: false,
      },
      startLocation: {
         //GeoJSON
         type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
         },
         coordinates: ['Number'], //Array of numbers
         address: String,
         description: String,
      },
      locations: [
         {
            type: {
               type: String,
               default: 'Point',
               enum: ['Point'],
            },
            coordinates: ['Number'], //Array of numbers
            address: String,
            description: String,
            day: Number,
         },
      ],
      //Child reference
      guides: [
         {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
         },
      ],
   },
   {
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   },
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
   //virtual properties cannot be used in query
   return this.duration / 7; //this- pointing to current document
});

//Virtual Populate
tourSchema.virtual('reviews', {
   ref: 'Review',
   foreignField: 'tour',
   localField: '_id',
});

//Mongoose Middleware
//Document Middleware -runs before .save() or .create() but not on insertMany()
tourSchema.pre('save', function (next) {
   //console.log(this); //this - currently processed middleware
   this.slug = slugify(this.name, { lowerCase: true });
   next();
});

// responsibe for performing embedding
// tourSchema.pre('save', async function (next) {
//    const guidesPromises = this.guides.map(
//       async (id) => await User.findById(id),
//    );

//    this.guides = await Promise.all(guidesPromises);
//    next();
// });

/* 
tourSchema.pre('save', function (next) {
   console.log('Will save to the database......');
   next();
});

tourSchema.post('save', function (doc, next) {
   console.log(doc);
   next();
});
 */

//Query Middleware
/* tourSchema.pre(/^find/, function (next) {
   //all strings start with 'find'
   // tourSchema.pre('find', function (next) {
   this.find({ secretTour: { $ne: true } });

   this.start = Date.now();
   next();
});

tourSchema.post(/^find/, function (docs, next) {
   console.log(
      `Query Execution Time in milliseconds: ${Date.now() - this.start}`,
   );

   console.log(docs);
   next();
}); */

tourSchema.pre(/^find/, function (next) {
   this.populate({
      path: 'guides',
      select: '-__v -passwordChangedAt',
   });
   next();
});

//Aggregation Middleware
// tourSchema.pre('aggregate', function (next) {
//    // console.log(this.pipeline());
//    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//    next();
// });

//Model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
