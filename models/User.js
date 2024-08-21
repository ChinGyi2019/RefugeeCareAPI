const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number }
}, {
    toJSON: {
        transform: function(doc, ret) {
          delete ret.password;
          return ret;
        }
      },
      toObject: {
        transform: function(doc, ret) {
          // delete ret.password;
          return ret;
        }
      }
});

module.exports = mongoose.model('User', userSchema);
