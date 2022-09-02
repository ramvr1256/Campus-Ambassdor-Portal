const router = require("express").Router();
const { Project } = require("../models/project");
const { Request } = require("../models/request");
const tokenAuth = require("../middleware/tokenAuth");
const { isProf, isStudent } = require("../middleware/userCheck");
const { Student } = require("../models/student");
const { Professor } = require("../models/professor");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const Grid = require("gridfs-stream");
const crypto = require("crypto");
const config = require("config");
const GridFsStorage = require("multer-gridfs-storage");
const db = mongoose.connection;

let gfs;
db.once("open", function() {
  gfs = Grid(db.db, mongoose.mongo);
});
function Redirect(message)
{
  return "<script type='text/javascript'>  alert('"+message+"');  window.location.href = '/home';  </script>";
}
//Resume student view route
router.get("/resume", tokenAuth, isStudent, async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.user._id });
    if (!student) return res.status(401).send("You are not logged in.");
    if (!student.resume) return res.status(404).send("No resume found.");
    var readstream = await gfs.createReadStream({
      _id: student.resume,
      root: "resume"
    });
    readstream.pipe(res);
  } catch (err) {
    console.log(err.message);
    res.send(err.message);
  }
});
// referal
router.get("/referal/1234/:ca_id", async (req, res) => {
  var student = await Student.findOne({techid:req.params.ca_id});
  console.log('ca id = '+ req.params.ca_id);
  if(!student){
    res.send('0');
  }
  else{
    var totp = student.points + 20;
    var refp = student.referal_points + 20;
    student.set({points:totp});
    student.set({referal_points:refp});
    await student.save();
    res.send('1');
    //console.log('here');
  }

})

router.get("/leader", tokenAuth, async (req, res) => {
  try {
 
    const user = await Student.findOne({ _id: req.user._id }).select(
      "name mail phone college email"
    );
    const student=await Student.find().sort({ points: "desc" }).select(
      "name mail phone college points referal_points "
    );
    if(user){  
      const index = student.findIndex(x => x._id ==user.id);
      res.render("dash/leader",{student:student,index:index,name:user.name,email:user.email});
    }
    else{
      res.render("dash/profleader",{student:student,index:-1,name:"admin",email:""}); 
    }

    } catch (err) {
    console.log(err.message);
    res.send('Internal Server Error');
  }
});

//Resume Professor view route
router.get("/resume/:id", tokenAuth, isProf, async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id });
    if (!student) return res.status(404).send("Not found");
    if (!student.resume) return res.status(404).send("No resume found.");
    var readstream = await gfs.createReadStream({
      _id: student.resume,
      root: "resume"
    });
    readstream.pipe(res);
  } catch (err) {
    console.log(err.message);
    res.send(err.message);
  }
});

//File upload settings

//For development purposes mime type has been changed.
//It should be 'application/pdf'
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/plain") cb(null, true);
  else cb(new Error("Please upload a file in pdf format"), false);
};

const storage = new GridFsStorage({
  url: config.get("DB_URL"),
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "resume"
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024
  },
  fileFilter: fileFilter
}).single("resume");

// STudent profile resume upload route
router.post("/student/profile", tokenAuth, isStudent, async (req, res) => {
 
      const student = await Student.findOne({ _id: req.user._id });
  
      student.set({techid:req.body.techid,name:req.body.name,college:req.body.college,phone:req.body.phone,mail:req.body.mail});
      await student.save();
      // Everything went fine.
      res.send(Redirect("Profile updated successfully"));
    
  
});

// BOTH: Home page
router.get("/", tokenAuth, async (req, res) => {
  const isProf = req.user.is_prof;
  if (!isProf) {
    // User is a student
    try {
      const student = await Student.findOne({ _id: req.user._id }).select(
        "name rollNumber mail phone college email"
      );
      const date = Date.now() - 15 * 24 * 60 * 60 * 1000; // 15 days
      const recentprojects = await Project.find({
        createdAt: { $gte: date },
        available: true
      })
        .sort({ createdAt: "desc" })
        .populate("professor", "name department");
      const studentrequests = await Request.find({ student: req.user._id })
        .sort({ createdAt: "desc" })
        .populate("professor", "name department")
        .populate("project", "title description lastDate points")
        .populate("comments");
        var check =0;
        if((!student.mail)||(!student.phone)||(!student.college)){
          check=1;
        }
        const allproject= await Project.find().sort({ createdAt: "desc" });
        var actproject=new Set();//accepted projects
        const allrequest = studentrequests;
       
        for(request in allrequest){
          if((allrequest[request].status=="Accepted")||(allrequest[request].status=="Pending"))
          {
            actproject.add(allrequest[request].project._id+"");
          }
        }
       
        const nactproject= (allproject.filter(obj => actproject.has(obj._id+""))); //set of not accepted projects


        
      res.render("dash/studentindex", {
        studentrequests: studentrequests,
        name: student.name,
        rollNumber: student.rollNumber,
        check:check,
        email:student.email,
      });
    } catch (err) {
      res.status(400).send("Invalid User");
      console.log(err);
      
    }
  } else {
    // User is a professor
    try {
      const professor = await Professor.findOne({ _id: req.user._id });
      const projects = await Project.find({ professor: professor }).sort({
        createdAt: "desc"
      });
      res.render("dash/professorindex", {
        projects: projects,
        name: professor.name,
        PfNo: professor.PfNo,
      });
    } catch (err) {
      res.status(400).send(err.message);
    }
  }
});
//LOGOUT
router.get("/user/logout", tokenAuth, async (req, res) => {
  res.render("dash/logout");
});

// STudent profile route
router.get("/student/profile", tokenAuth, async (req, res) => {
  var student = await Student.findOne({ _id: req.user._id });
  res.render("dash/studentprofile", { student: student });
});
//Professor Profile route
router.get("/professor/profile",tokenAuth, async (req, res) => {
  var professor = await Professor.findOne({ _id: req.user._id });
  res.render("dash/professorprofile", { professor: professor, name:professor.name, PfNo:professor.PfNo });
});

//Change Password Route
router.get("/profile/changepwd", tokenAuth, async (req, res) => {
  var student = await Student.findOne({ _id: req.user._id });
  var professor = await Professor.findOne({ _id: req.user._id });
  if (student)
    res.render("dash/changepasswordstud", {
      student: student,
      name: student.name,
      rollNumber: student.rollNumber
    });
  if (professor)
    res.render("dash/changepasswordprof", { professor: professor, name:professor.name, PfNo:professor.PfNo });
});

module.exports = router;
