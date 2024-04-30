const mongoose = require("mongoose");
// This is a test commit to demonstrate online edit file on github

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 3
  },
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Professor"
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ""
    // minlength: 100
    //   maxlength:
  },
    createdAt: {
    type: Date,
    default: Date.now()
  },
    lastDate:{
      type:String,
      default: "19 March 2019"
    },
  available: {
    type: Boolean,
    default: true
  },
  whatsapp:{
    type:String,
    default:null
  },
  facebook:{
    type:String,
    default:null
  },
  twitter:{
    type:String,
    default:null
},
  

});
const Project = mongoose.model("Project", projectSchema);

exports.Project = Project;
