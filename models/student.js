const Joi = require("joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1
  },
 college: {
    type: String,
    // unique: true
    default:null,
  },
  techid: {
    type: String,
    // unique: true
    default:null,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false
  },
  password: {
    type: String,
    // Password required only when email is verified
    required: function() {
      return this.isVerified;
    },
    minlength: 8,
    maxlength: 1024
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  role: {
    type: String,
    default: "student"
  },
  points: {
    type: Number,
    default: 0,
  },
  referal_points: {
    type: Number,
    default: 0,
  },
  phone:{
    type:String,
    default:null,
  },
  mail:{
    type:String,
    default:null,
  }
});

// Delete unverified accounts after 24 hrs
// studentSchema.index({ createdAt: 1 }, { expires: '24h' });

// Generate login auth token
studentSchema.methods.generateAuthToken = function(
  options = { useMailKey: true }
) {
  const key = options.useMailKey
    ? config.get("mailTokenKey")
    : config.get("authTokenKey");
  const jwtOptions = options.useMailKey ? { expiresIn: "30m" } : undefined;
  const token = jwt.sign(
    {
      _id: this._id,
      email: this.email,
      is_prof: false
    },
    key,
    jwtOptions
  );
  return token;
};

// Validate student login info
function validate(studentLoginInfo) {
  const schema = {
    email: Joi.string()
      .required()
      .email(),
    password: Joi.string()
      .min(8)
      .max(255)
      .required()
  };
  return Joi.validate(studentLoginInfo, schema);
}

const Student = mongoose.model("Student", studentSchema);
exports.Student = Student;
exports.validateStudent = validate;
