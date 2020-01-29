const express = require("express");
const router = express.Router({ mergeParams: true });
const Camground = require("../models/campground");
const Comment = require("../models/comment");
const middleware = require("../middleware");

//=========================
//  comments routes: new
//=========================
router.get("/new", middleware.isLoggedin, (req, res) => {
  // find camxpground by id
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
router.post("/", middleware.isLoggedin, (req, res) => {
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
          // 5. add username and id to comment
          comment.author.id = req.user.id;
          comment.author.username = req.user.username;
          // 6. save comment
          comment.save();

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
//=========================
//  comments routes: edit comment
//=========================
router.get("/:commentId/edit", middleware.checkCommentOwnership, (req, res) => {
  Comment.findById(req.params.commentId, (err, foundComment) => {
    if (err) {
      res.redirect("back");
    } else {
      res.render("comments/edit", {
        campground_id: req.params.id,
        comment: foundComment
      });
    }
  });
});
//=========================
//  comments routes: update comment
//=========================
router.put("/:commentId", middleware.checkCommentOwnership, (req, res) => {
  Comment.findByIdAndUpdate(
    req.params.commentId,
    req.body.comment,
    (err, updatedComment) => {
      if (err) {
        res.redirect("back");
      } else {
        res.redirect("/campgrounds/" + req.params.id);
      }
    }
  );
});
//=========================
//  comments routes: delete comment
//=========================
router.delete("/:commentId", middleware.checkCommentOwnership, (req, res) => {
  Comment.findByIdAndRemove(req.params.commentId, err => {
    if (err) {
      res.redirect("back");
    } else {
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

module.exports = router;
