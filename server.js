'use strict';

//!This is the entry point of the application

//Requiring 3rd party modules
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); //storing the config.env variables into the environment variables on NodeJS (process.env)
//doing it at the top of the entry point file so that all other files can access those variables from process.env

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception!...SHUTTING DOWN 👋');
  console.log(err.name, ',', err.message);

  process.exit(1);
});

//Requiring core modules
const mongoose = require('mongoose');
const app = require('./app');

//Database connection
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB).then(() => {
  console.log('🚀 Database successfully connected 🚀');
});

//Starting the server
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server is listening on port: ${process.env.PORT || 3000} 🚀`);
});

//Global promise rejections handler (Safety Net)
process.on('unhandledRejection', (err) => {
  console.log('SHUTTING DOWN 👋');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
