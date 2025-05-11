const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
   console.log(err);
   console.log(`UNCAUGHT EXCEPTION!!!! Application is shutting down.....`);
   process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE_CONN.replace('<PASSWORD>', process.env.DB_PWD);

mongoose
   .connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
   })
   // eslint-disable-next-line no-unused-vars
   .then((con) => {
      // console.log(con.connections);
      // console.log(con.connections[0].states);
      // console.log(con.connections[0]._readyState);
      console.log('Connected to database successfully.');
   });

// console.log(app.get('env'));
// console.log(process.env);

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
   console.log(`App running on ${port}....`);
});

//Handling unhandled rejections
process.on('unhandledRejection', (err) => {
   console.log(err);
   console.log(`UNHANDLED REJECTION!!!! Application is shutting down.....`);
   //The following way of closing application my cause abrot of pending request. So choose graceful shutdown
   //process.exit(1);

   //This is graceful shutdown
   server.close(() => {
      process.exit(1);
   });
});

//Handling uncaught exception - it is good practice to have it on top
// process.on('uncaughtException', (err) => {
//    console.log(err);
//    console.log(`UNCAUGHT EXCEPTION!!!! Application is shutting down.....`);

//    //This is graceful shutdown
//    server.close(() => {
//       process.exit(1);
//    });
// });

process.on('SIGTERM', () => {
   console.log('SIGTERM received. Shutting down gracefully');
   server.close(() => {
      console.log('Process Terminated!!');
   });
});
