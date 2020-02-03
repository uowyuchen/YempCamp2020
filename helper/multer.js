const multer = require("multer");

module.exports = multer({
  storage: multer.diskStorage({
    filename: function(req, file, callback) {
      callback(null, Date.now() + file.originalname);
    }
  }),

  fileFilter: function(req, file, callback) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return callback(new Error("Only image files are allowed!"), false);
    }
    // if (req.file.path == undefined) {
    //   return callback(new Error('Only image files are allowed!'), false)
    // }

    callback(null, true);
  }
}).single("image");
