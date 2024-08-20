const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address'] // Email validation
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: { type: String },
    resetPasswordTokenExpires: { type: Date },
});

userSchema.methods.generateResetToken = async function () {
    const user = this;
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
