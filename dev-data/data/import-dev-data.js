const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: '../../config.env' });

const DB = process.env.DATABASE_CONN.replace('<PASSWORD>', process.env.DB_PWD);

mongoose
   .connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
   })
   .then((con) => {
      // console.log(con.connections);
      // console.log(con.connections[0].states);
      // console.log(con.connections[0]._readyState);

      console.log('Connected to database successfully.');
   });

const tours = fs.readFileSync('./tours.json', 'utf-8');
const users = fs.readFileSync('./users.json', 'utf-8');
const reviews = fs.readFileSync('./reviews.json', 'utf-8');

//IMPORT DATA INTO DATABASE

const importData = async () => {
   try {
      //convert JSON to javascript object
      const toursObj = JSON.parse(tours);
      const usersObj = JSON.parse(users);
      const reviewsObj = JSON.parse(reviews);
      //passing the js object to create documents in database
      await Tour.create(toursObj);
      await User.create(usersObj, { validateBeforeSave: false });
      await Review.create(reviewsObj);
      console.log('Data successfully loaded');
   } catch (err) {
      console.log(err);
   }
};

//DELETE ALL DATA FROM COLLECTION

const deleteData = async function () {
   try {
      await Tour.deleteMany({});
      await User.deleteMany({});
      await Review.deleteMany({});
      console.log('Data deletion successful');
      process.exit();
   } catch (err) {
      console.log(err);
   }
};

if (process.argv[2] === '--import') {
   importData();
} else if (process.argv[2] === '--delete') {
   deleteData();
}
console.log(process.argv); //give the root of node path and file that is currently running, etc if any other from the command --> node import-dev-data.js --import
