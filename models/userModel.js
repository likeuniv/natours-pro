const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please tell us your name'],
   },
   email: {
      type: String,
      required: [true, 'Provide your email address'],
      unique: true,
      lowerCase: true,
      validate: [validator.isEmail, 'Please provide valid email'],
   },
   photo: {
      type: String,
      default: 'default.jpeg',
   },
   role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
   },
   password: {
      type: String,
      required: [true, 'Provide your password'],
      minLength: 8,
      select: false,
   },
   passwordConfirm: {
      type: String,
      required: [true, 'Provide confirm your password'],
      validate: {
         //This is only works on CREATE & SAVE not on UPDATE.
         validator: function (el) {
            return el === this.password;
         },
         message: 'Password not matched.',
      },
   },
   passwordChangedAt: Date,
   passwordResetToken: String,
   passwordResetExpires: Date,
   active: {
      type: Boolean,
      default: true,
      select: false,
   },
});

userSchema.pre('save', async function (next) {
   // console.log('Pre save');

   //Only run if password is modified
   if (!this.isModified('password')) {
      // console.log('modified');

      return next();
   }

   //hashing the password - using  bcrypt
   //Hash password with cost of 12
   this.password = await bcrypt.hash(this.password, 12);

   //unset password confirm
   this.passwordConfirm = undefined;
   next();
});

userSchema.pre('save', function (next) {
   if (!this.isModified('password') || this.isNew) return next();

   this.passwordChangedAt = Date.now() - 1000;
   next();
});

userSchema.pre(/^find/, function (next) {
   this.find({ active: { $ne: false } });
   next();
});

//instance methods
userSchema.methods.correctPassword = async function (
   candidatePassword,
   userSentPassword,
) {
   return await bcrypt.compare(candidatePassword, userSentPassword);
};

userSchema.methods.changesPasswordAfter = function (JWTTimeStamp) {
   // console.log(this.passwordChangedAt, JWTTimeStamp);
   //JWTTimeStamp is in seconds
   if (this.passwordChangedAt) {
      const changedTimeStamp = parseInt(
         this.passwordChangedAt.getTime() / 1000,
         10,
      );

      return JWTTimeStamp < changedTimeStamp;
   }

   //FALSE means not changed.
   return false;
};

userSchema.methods.createPasswordResetToken = function () {
   const resetToken = crypto.randomBytes(32).toString('hex');
   this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

   return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
