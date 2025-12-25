const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name! '],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'A password must contain at least 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: true,

    validate: {
      //this keyword only points to the current doc on New document creation (.create()/.save()) Not on update!!!
      validator: function (pass) {
        return pass === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  photo: String,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

});

userSchema.pre('save', async function (next) {
  //Only run this func if password was actually modified
  if (!this.isModified('password')) return next();

  //hashing the password with a cost of 12 means that number of hashing/salting rounds will be = 2^12
  this.password = await bcrypt.hash(this.password, 12);

  //Not persisting the confirmed password in DB by setting it to undefined
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: 'false' } });
  next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    // console.log(changedTimeStamp, JWTTimestamp);

    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  //Encrypted token to store in the DB
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //token expires after 10 min

  return resetToken; //Return plain token (original) to send it via email to the user
};

const User = mongoose.model('User', userSchema);

module.exports = User;
