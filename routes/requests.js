const { Request } = require("../models/request");
const { Student } = require("../models/student");
const { Professor } = require("../models/professor");
const { Project } = require("../models/project");
const tokenAuth = require("../middleware/tokenAuth");
const { isProf, isStudent } = require("../middleware/userCheck");
const router = require("express").Router();
const mail = require("../libs/mail");
//storage
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const Grid = require("gridfs-stream");
const crypto = require("crypto");
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




//See the uploaded file of the project
router.get("/view/file/:id", tokenAuth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id });
    if (!project) return res.status(404).send("Not found");
    if (!project.file) return res.status(404).send("No file found.");
    var readstream = await gfs.createReadStream({
      _id: project.file,
      root: "projectfile"
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
  if (file.mimetype === "image/jpeg") cb(null, true);
  else cb(new Error(Redirect("Please upload a file in image format")), false);
};

const storage = new GridFsStorage({
  url:
  "mongodb+srv://teckriti:techkriti@cluster0-xl6dl.mongodb.net/test?retryWrites=true&w=majority",
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "projectfile"
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  fileFilter: fileFilter
}).single("projectfile");


router.get("/view/professor", tokenAuth, isProf, async (req, res) => {
  var prof_user = await Professor.findOne({ _id: req.user._id });
  const prof_request = await Request.find({ professor: prof_user });
  res.send(prof_request);
});

// PROF SIDE: See a student request
router.get("/view/:id", tokenAuth, isProf, async (req, res) => {
  try {
    const professor = await Professor.findOne({ _id: req.user._id });
    const request = await Request.findById(req.params.id)
      .populate("project", "title")
      .populate("student", "name department email");
    res.render("dash/requestdetailview", {
      request: request,
      name: professor.name,
      PfNo:professor.PfNo
    });
  } catch (error) {
    res.status(404).send("Request not found");
  }
});
// PROF SIDE SEE REQUEST FILE

router.get("/FILE/view/:id", tokenAuth, async (req, res) => {
  try {
    const request = await Request.findOne({ _id: req.params.id });
    
      //console.log(request)
      if(request.file==null)
      {
        return res.send("<script>alert('file not found');window.close();</script>");
        
      }
      var readstream = await gfs.createReadStream({
        _id: request.file,
        root: "projectfile"
      });
      res.setHeader('Content-Type', 'image/jpeg');
    readstream.pipe(res);
  } catch (error) {
    res.status(404).send(error);
  }
});

// PROF SIDE: Accept or reject request
router.post("/view/professor/", tokenAuth, isProf, async (req, res) => {
  const request = await Request.findById(req.body.id);
  if (request.professor._id != req.user._id) return res.send("Invalid access");
  const result = req.body.status;
  // If no such request found
  if (!request) res.status(404).send("No requests found");
  // Set request status as indicated by req.body.status
  request.set({ status: result });

  // Get the project
  const project = await Project.findById(request.project._id);
  if (!project) return res.status(404).send("Project not found");
  // Get the student
  const student = await Student.findById(request.student._id);
  if (!student)
    return res.status(400).send("Bad request: Student is necessary");
  
  // Add or remove student from project accordingly
  if (result == "Accepted") {
    var totpoint = student.points+project.points;
    await student.set({points:totpoint});
    await student.save();
    
  }
  // Save to DB and respond.
  await project.save();
  await request.save();
  res.send("done");
});

// STUDENT SIDE: Apply for a project (Create request)
router.post("/createrequests/:id", tokenAuth, isStudent, async (req, res) => {
  // Get the student and project
  const student = await Student.findOne({ _id: req.user._id });
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).send("No project found");
  // Check if request already exists
  let requestarray = await Request.find({ project: project, student: student });
  let requestr = requestarray[requestarray.length-1];
 
  if ((requestr!=null)&&(requestr.status!="Rejected")) return res.status(400).send(Redirect("Task has already been requested please wait before sending another request"));
  let uploaderror = 0;
 
  // Create new request
  try {
    
   await upload(req, res, async err => {
      if (err) {
        // A Multer error occurred when uploading.
        console.log(err.message);
        //res.send(err.message);
      } else {
       
           let request = new Request({
            project: project,
            professor: project.professor,
            student: student,
            description: req.body.description
          });

        if (req.file) {
          request.set({ file: req.file.id });
          await request.save();
          res.send(Redirect("Task requested successfully"));
        }
        else
        {
          uploaderror=1;
        }
      }
    });
    
   if(uploaderror)
   return res.send(Redirect("Please Upload file before requesting"));
  
    project.no_requests++;
    await project.save();
   
  } catch (error) {
    res.status(500).send("Internal server error");
    //console.log(error.message);
  }
});

//STUDENT SIDE : See a request and its status
router.get("/:id", tokenAuth, isStudent, async (req, res) => {
  const student = await Student.findOne({ _id: req.user._id }).select(
    "name rollNumber"
  );
  const request = await Request.findById(req.params.id)
    .populate("project", "title")
    .populate("professor", "name department");
  if (request) {
    res.render("dash/studentrequestview", {
      request: request,
      name: student.name,
      rollNumber: student.rollNumber
    });
    //console.log(request);
  } else res.send("NO request found");
});

//Prof side: post request comment
router.post("/comment/:id", tokenAuth, isProf, async (req, res) => {
  const request = await Request.findById(req.params.id);
  request.set({ comment : req.body.comment});
  
  await request.save();
  
  return res.redirect('/request/view/'+request.id);
});



module.exports = router;
