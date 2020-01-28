const express = require("express");
const router = express.Router({ mergeParams: true });
const Camground = require("../models/campground");
const Comment = require("../models/comment");

//=========================
//  comments routes: new
//=========================
router.get("/new", isLoggedin, (req, res) => {
  // find campground by id
  Camground.findById(req.params.id, (err, campground) => {
    if (err) {
      console.log(err);
    } else {
      res.render("comments/new", { campground: campground });
    }
  });
});

//=========================
//  comments routes: create comment
//=========================
router.post("/", isLoggedin, (req, res) => {
  //1. lookup campground using ID
  Camground.findById(req.params.id, (err, campground) => {
    if (err) {
      console.log(err);
      res.redirect("/campgrounds");
    } else {
      //2. create new comment
      Comment.create(req.body.comment, (err, comment) => {
        if (err) {
          console.log(err);
        } else {
          //3. connect new comment to campground
          campground.comments.push(comment);
          campground.save();
          //4. redirect campground show page
          res.redirect(`/campgrounds/${campground.id}`);
        }
      });
    }
  });
});
//=======================
//    Middleware
//=======================
// isLogin 判断是否login
function isLoggedin(req, res, next) {
  //req.isAuthenticated是passport提供的方法
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}
module.exports = router;
