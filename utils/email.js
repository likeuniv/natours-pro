/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
   constructor(user, url) {
      this.to = user.email;
      this.firstName = user.name.split(' ')[0];
      this.url = url;
      this.from = `Pooja Reddy <${process.env.EMAIL_FROM}>`;
   }

   newTransport() {
      if (process.env.NODE_ENV === 'production') {
         //Sendgrid
         return 1;
      }

      return nodemailer.createTransport({
         host: process.env.EMAIL_HOST,
         port: process.env.EMAIL_PORT,
         auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PWD,
         },
      });
   }

   //Send the actual email
   async send(template, subject) {
      //1-Render HTML based on the pug template
      const html = pug.renderFile(
         `${__dirname}/../views/email/${template}.pug`,
         {
            firstName: this.firstName,
            url: this.url,
            subject,
         },
      );

      //2-Define email options
      const mailOptions = {
         from: this.from,
         to: this.to,
         subject,
         html,
         text: htmlToText.convert(html),
      };

      //3-create a transport and send email
      await this.newTransport().sendMail(mailOptions);
   }

   async sendWelcome() {
      await this.send('welcome', 'Welcome to the Natours Family!!!');
   }

   async sendPasswordReset() {
      await this.send('passwordReset', 'Reset Your Password');
   }
};

/*const sendEmail = async (options) => {
   //1-create a transporter - application used 'MAILTRAP'
   const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
         user: process.env.EMAIL_USERNAME,
         pass: process.env.EMAIL_PWD,
      },
      //Activate in gmail app as 'less secure app' option
   });
   //2-Define the email options
   const mailOptions = {
      from: 'Pooja Reddy <pooja@test.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      // html:
   };

   //3-Actually send the email
   await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;*/
