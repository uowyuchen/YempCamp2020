// all the middleware goes here
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const Review = require("../models/review");

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
        if (foundComment.author.id.equals(req.user.id) || req.user.isAdmin) {
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
        // 2. does user own the campground? or is the user is Admin?
        if (foundCampground.author.id.equals(req.user.id) || req.user.isAdmin) {
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

// check review ownership
middlewareObj.checkReviewOwnership = function(req, res, next) {
  if (req.isAuthenticated()) {
    Review.findById(req.params.review_id, function(err, foundReview) {
      if (err || !foundReview) {
        res.redirect("back");
      } else {
        // does user own the comment?
        if (foundReview.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash("error", "You don't have permission to do that");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You need to be logged in to do that");
    res.redirect("back");
  }
};

// check review existence
middlewareObj.checkReviewExistence = function(req, res, next) {
  if (req.isAuthenticated()) {
    Campground.findById(req.params.id)
      .populate("reviews")
      .exec(function(err, foundCampground) {
        if (err || !foundCampground) {
          req.flash("error", "Campground not found.");
          res.redirect("back");
        } else {
          // check if req.user._id exists in foundCampground.reviews
          var foundUserReview = foundCampground.reviews.some(function(review) {
            return review.author.id.equals(req.user._id);
          });
          if (foundUserReview) {
            req.flash("error", "You already wrote a review.");
            return res.redirect("/campgrounds/" + foundCampground._id);
          }
          // if the review was not found, go to the next middleware
          next();
        }
      });
  } else {
    req.flash("error", "You need to login first.");
    res.redirect("back");
  }
};

module.exports = middlewareObj;
