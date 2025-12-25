const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

//Creating Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less than or equal to 40 characters'],
      minlength: [10, 'A tour name must have more than or equal to 10 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: (easy, medium or difficult)',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be lower or equal to 5.0'],
      set: (val) => Math.round(val * 10) / 10, //Rounding the average rating with a small trick
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this keyword only points to the current doc on New document creation (save) Not on update!
          return val < this.price;
        },
        message: 'Discount ({VALUE}) must be less than the price',
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
      required: [true, 'A must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //geoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (val) {
            return val.length === 2;
          },
        },
      },
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
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //Child refrencing
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

tourSchema.index({ price: 1, ratingsAverage: -1 }); //creating an index on the price property
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationInWeeks').get(function () {
  return this.duration / 7;
});

//Virtual population
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//!DOCUMENT MIDDLEWARE: runs before .save() and .create() NOT updating a document
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

//!Responsible for embedding users(guides) into tours
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will Save Document....');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);

//   next();
// });

//! Query Middleware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); //!/^find/ means the strings which start with find
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query Took: ${Date.now() - this.start} ms`);

  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

// //! AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   next();
// });

//Creating Models and actually mongoDB internally knows the collection name by Changing the 1st arg to lowercase and pluralizes it
//But if you want to specify the collection name manually you can add a 3rd arg with your desired collection name ex: ('Tour', tourSchema, 'tours')
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
