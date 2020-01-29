// all the middleware goes here
const Campground = require("../models/campground");
const Comment = require("../models/comment");

const middlewareObj = {};

middlewareObj.checkCommentOwnership = (req, res, next) => {
  // 1. is user logged in?
  if (req.isAuthenticated()) {
    Comment.findById(req.params.commentId, (err, foundComment) => {
      if (err || !foundComment) {
        req.flash("error", "Comment not found");
        res.redirect("back");
      } else {
        // 2. does user own the comment?
        if (foundComment.author.id.equals(req.user.id)) {
          next();
        } else {
          req.flash("error", "You don't have permission to do that!");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You don't have permission to do that!");
    res.redirect("back");
  }
};

middlewareObj.checkCampgroundOwnership = (req, res, next) => {
  // 1. is user logged in?
  if (req.isAuthenticated()) {
    Campground.findById(req.params.id, (err, foundCampground) => {
      if (err || !foundCampground) {
        req.flash("error", "Campground not found");
        res.redirect("back");
      } else {
        // 2. does user own the campground?
        if (foundCampground.author.id.equals(req.user.id)) {
          next();
        } else {
          req.flash("error", "You don't have permission to do that!");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("back");
  }
};

// isLogin 判断是否login
middlewareObj.isLoggedin = (req, res, next) => {
  //req.isAuthenticated是passport提供的方法
  if (req.isAuthenticated()) {
    return next();
  }
  // flash message
  req.flash("error", "Please Login First!");
  res.redirect("/login");
};

module.exports = middlewareObj;
