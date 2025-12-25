const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter (a service like gmail for example)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //Define the email options
  const mailOptions = {
    from: 'Mohamed Koura <mo@outlook.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  //Actually send the email with nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
