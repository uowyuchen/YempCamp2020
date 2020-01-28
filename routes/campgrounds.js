const express = require("express");
const router = express.Router();
const Camground = require("../models/campground");
const Comment = require("../models/comment");

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
router.post("/", (req, res) => {
  // get data from form and add to campgrounds array
  const name = req.body.name;
  const image = req.body.image;
  const description = req.body.description;

  const newCampgrounds = { name, image, description };
  // Create a new campground and save to DB
  Camground.create(newCampgrounds, (err, newCampground) => {
    if (err) {
      console.log(err);
    } else {
      // redirect back to campgrounds page
      res.redirect("/campgrounds");
    }
  });
});

// New - show form to create new campground
router.get("/new", (req, res) => {
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

module.exports = router;
