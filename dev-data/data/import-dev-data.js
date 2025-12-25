//!Script to import data into the database or delete all data from a collection

const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(() => {
  console.log('🚀 Database is successfully connected 🚀');
});

//READING JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, `utf-8`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, `utf-8`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, `utf-8`));

//IMPORT DATA INTO DATABASE (tours collection)
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data is successfully loaded!');
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

//Delete All Data from a collection
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data is successfully deleted!');
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
