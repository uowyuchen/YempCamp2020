const express = require("express");
const router = express.Router();
const Camground = require("../models/campground");
const middleware = require("../middleware");

//=======================
//  Campgrounds Routes
//=======================

// Index - show all campgrounds
router.get("/", (req, res) => {
  // Get All Campgrounds
  Camground.find({}, (err, allCampgrounds) => {
    if (err) {
      console.log(err);
    } else {
      res.render("campgrounds/index", { campgrounds: allCampgrounds });
    }
  });
});

// Create - add new campground to DB
router.post("/", middleware.isLoggedin, (req, res) => {
  // 1. get data from form and add to campgrounds array
  const name = req.body.name;
  const image = req.body.image;
  const description = req.body.description;

  // 4. get the author who creates this campground
  var author = {
    id: req.user.id,
    username: req.user.username
  };
  // 5. author就是把谁create的campground这个人加入此campground
  const newCampgrounds = { name, image, description, author };
  // 2. Create a new campground and save to DB
  Camground.create(newCampgrounds, (err, newCampground) => {
    if (err) {
      console.log(err);
    } else {
      // 3. redirect back to campgrounds page
      res.redirect("/campgrounds");
    }
  });
});

// New - show form to create new campground
router.get("/new", middleware.isLoggedin, (req, res) => {
  res.render("campgrounds/new");
});

// Show - show more info about one campground
router.get("/:id", (req, res) => {
  // find the campground with provided ID
  Camground.findById(req.params.id)
    .populate("comments")
    .exec((err, foundCampground) => {
      if (err) {
        console.log(err);
      } else {
        // render show template with that campground
        res.render("campgrounds/show", { campground: foundCampground });
      }
    });
});

// Edit Campground Route
router.get("/:id/edit", middleware.checkCampgroundOwnership, (req, res) => {
  Camground.findById(req.params.id, (err, foundCampground) => {
    res.render("campgrounds/edit", { campground: foundCampground });
  });
});

// Update Campground Route
router.put("/:id", middleware.checkCampgroundOwnership, (req, res) => {
  // 1. find and update the correct campground
  Camground.findByIdAndUpdate(
    req.params.id,
    req.body.campground,
    (err, updatedCampground) => {
      if (err) {
        res.redirect("/campgrounds");
      } else {
        // 2. redirect
        res.redirect(`/campgrounds/${req.params.id}`);
      }
    }
  );
});

// Destroy campground route
router.delete("/:id", middleware.checkCampgroundOwnership, (req, res) => {
  Camground.findByIdAndRemove(req.params.id, err => {
    if (err) {
      res.redirect("/campgrounds");
    } else {
      res.redirect("/campgrounds");
    }
  });
});

module.exports = router;
