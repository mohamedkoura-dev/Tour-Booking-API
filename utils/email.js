const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');
const pug = require('pug');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.from = `Mohamed Ayman <${process.env.EMAIL_FROM}>`;
    this.url = url;
  }

  newTransport() {
    //Sendgrid for sending real emails in production
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'Sendgrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    }

    //If not so we use mailtrap for testing purposes
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //A reusable function to use with different kinds of emails like the below sendWelcome method
  async send(template, subject) {
    //1) Render email template
    try {
      const html = pug.renderFile(
        `${__dirname}/../views/emails/${template}.pug`,
        {
          firstName: this.firstName,
          url: this.url,
          subject,
        },
      );

      //2) Define email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText.convert(html),
      };

      //3) Create transport and send the email with the options
      await this.newTransport().sendMail(mailOptions);
    } catch (error) {
      console.error('📧 Email error:', error.message);

      // DO NOT throw in production
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    }
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome To Natours!!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Forgot Your Password!');
  }
};
