const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const User = require("../models/user");
const Review = require("../models/review");
const Notification = require("../models/notification");
const middleware = require("../middleware");
// Nodejs node-geocoder
const NodeGeocoder = require("node-geocoder");
const escapeRegex = require("../helper/fuzzy-search");
// Require Multer
const upload = require("../helper/multer");
// require cloudinary
const cloudinary = require("../helper/cloudinary");

// Geocoder Config
const options = {
  provider: "google",

  // Optional depending on the providers
  httpAdapter: "https", // Default
  apiKey: process.env.GEOCODER_API_KEY, // for Mapquest, OpenCage, Google Premier
  formatter: null // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);

//=======================
//  Campgrounds Routes
//=======================

// Index - show all campgrounds
router.get("/", (req, res) => {
  // pagination
  const perPage = 4;
  const pageQuery = parseInt(req.query.page);
  const pageNumber = pageQuery ? pageQuery : 1;

  let noMatch;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    Campground.find({ name: regex })
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec()
      .then(matchedCampgrounds => {
        Campground.countDocuments({ name: regex })
          .exec()
          .then(count => {
            if (matchedCampgrounds.length < 1) {
              noMatch = `No campground found by this key words of "${req.query.search}", please try again!`;
            }
            res.render("campgrounds/index", {
              campgrounds: matchedCampgrounds,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: req.query.search,
              noMatch
            });
          })
          .catch(err => {
            if (err || !matchedCampgrounds) {
              res.redirect("back");
            }
          });
      })
      .catch(err => {
        if (err || !matchedCampgrounds) {
          res.redirect("back");
        }
      });
  } else {
    Campground.find()
      .skip(perPage * pageNumber - perPage)
      .limit(perPage)
      .exec()
      .then(foundCampgrounds => {
        Campground.countDocuments()
          .exec()
          .then(count => {
            res.render("campgrounds/index", {
              campgrounds: foundCampgrounds,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: false,
              noMatch
            });
          })
          .catch(err => {
            if (err || !foundCampground) {
              res.redirect("back");
            }
          });
      })
      .catch(err => {
        if (err || !foundCampground) {
          res.redirect("back");
        }
      });
  }
});

// Create - add new campground to DB
router.post("/", middleware.isLoggedin, upload, (req, res) => {
  // 1. check if image is uploaded, if no image, redirect back
  if (req.file == undefined) {
    req.flash("error", "No File Seleted!");
    res.redirect("back");
  } else {
    // 2. if there is image being uploaded
    // 要等上传的图片的result返回来 再继续下面的！！！
    cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
      if (err) {
        // if error happens on image upload
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        // 3. if image is uploaded successfully
        // 4. get data from form and add to campgrounds object
        const { name, description, price } = req.body;
        // 5. get the author who creates this campground
        const author = {
          id: req.user.id,
          username: req.user.username
        };
        // 6. pass the location to geocoder API, it sends back err or data
        geocoder.geocode(req.body.location, (err, data) => {
          if (err || !data.length) {
            // error happens when geocoder working
            req.flash("error", "Invalid Address");
            res.redirect("back");
          } else {
            // 7. geocoder give us the lat & lng and format our location
            const lat = data[0].latitude;
            const lng = data[0].longitude;
            const location = data[0].formattedAddress;

            // 8. create a new campground object in order to save to DB
            const newCampground = {
              name,
              image: result.secure_url,
              imageId: result.public_id,
              description,
              location,
              lat,
              lng,
              author,
              price
            };
            // 9. Create a new campground and save to DB
            Campground.create(newCampground, (err, newCreatedCampground) => {
              if (err) {
                req.flash("error", err.message);
                res.redirect("back");
              } else {
                // 10. 找到当前user的followers
                User.findById(req.user.id)
                  // 10. 找到当前user的followers
                  .populate("followers")
                  .exec((err, foundUser) => {
                    if (err) {
                      console.log(err);
                    } else {
                      // 11. create a new notification for all followes
                      let newNotification = {
                        username: req.user.username,
                        campgroundId: newCreatedCampground.id
                      };
                      // 循环所有的followers，把这个新通知告诉他们
                      for (const follower of foundUser.followers) {
                        Notification.create(
                          newNotification,
                          (err, newCreatedNotification) => {
                            if (err) {
                              return console.log(err);
                            }
                            // 把notification放到followers的notifications array中
                            follower.notifications.push(newCreatedNotification);
                            follower.save();
                          }
                        );
                      }
                    }
                  });
                // 10. redirect back to campgrounds page
                // console.log(newCreatedCampground);
                res.redirect(`/campgrounds/${newCreatedCampground.id}`);
              }
            });
          }
        });
      }
    });
  }
});

// New - show form to create new campground
router.get("/new", middleware.isLoggedin, (req, res) => {
  res.render("campgrounds/new");
});

// Show - show more info about one campground
router.get("/:id", (req, res) => {
  // find the campground with provided ID
  Campground.findById(req.params.id)
    .populate("comments")
    .populate({
      path: "reviews",
      options: { sort: { createdAt: -1 } }
    })
    .exec((err, foundCampground) => {
      if (err || !foundCampground) {
        req.flash("error", "Campground not found");
        res.redirect("back");
      } else {
        // render show template with that campground
        res.render("campgrounds/show", { campground: foundCampground });
      }
    });
});

// Edit Campground Route
router.get("/:id/edit", middleware.checkCampgroundOwnership, (req, res) => {
  Campground.findById(req.params.id, (err, foundCampground) => {
    res.render("campgrounds/edit", { campground: foundCampground });
  });
});

// Update Campground Route
router.put("/:id", middleware.checkCampgroundOwnership, upload, (req, res) => {
  // 1. undefined means image is not going be edited
  if (req.file == undefined) {
    geocoder.geocode(req.body.location, function(err, data) {
      if (err || !data.length) {
        req.flash("error", "Invalid address");
        res.redirect("back");
      } else {
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        // 2. update others except image
        Campground.findByIdAndUpdate(
          req.params.id,
          req.body.campground,
          (err, updatedCampground) => {
            if (err) {
              req.flash("error", err.message);
              res.redirect("back");
            } else {
              req.flash("success", "Successfully Updated!");
              res.redirect(`/campgrounds/${req.params.id}`);
            }
          }
        );
      }
    });
  } else {
    // 3. image is being edited
    // 4. first delete previous image through finding this campground
    Campground.findById(req.params.id, (err, foundCampground) => {
      if (err) {
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        // 5. delete privious image
        cloudinary.v2.uploader.destroy(
          foundCampground.imageId,
          (err, result) => {
            if (err) {
              req.flash("error", err.message);
              res.redirect("back");
            } else {
              // 6. upload new image
              cloudinary.v2.uploader.upload(req.file.path, function(
                err,
                result
              ) {
                if (err) {
                  req.flash("error", err.message);
                  res.redirect("back");
                } else {
                  geocoder.geocode(req.body.location, function(err, data) {
                    if (err || !data.length) {
                      // console.log(err);
                      req.flash("error", "Invalid address");
                      res.redirect("back");
                    } else {
                      req.body.campground.lat = data[0].latitude;
                      req.body.campground.lng = data[0].longitude;
                      req.body.campground.location = data[0].formattedAddress;

                      req.body.campground.image = result.secure_url;
                      req.body.campground.imageId = result.public_id;

                      Campground.findByIdAndUpdate(
                        req.params.id,
                        req.body.campground,
                        (err, campground) => {
                          if (err) {
                            req.flash("error", err.message);
                            res.redirect("back");
                          } else {
                            req.flash("success", "Successfully Updated!");
                            res.redirect("/campgrounds/" + campground._id);
                          }
                        }
                      );
                    }
                  });
                }
              });
            }
          }
        );
      }
    });
  }
});

// Destroy campground route
router.delete("/:id", middleware.checkCampgroundOwnership, (req, res) => {
  // 1. find which campground will be deleted
  Campground.findById(req.params.id, (err, foundCampground) => {
    if (err) {
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      // 2. deletes image associated with the campground
      cloudinary.v2.uploader.destroy(foundCampground.imageId, (err, result) => {
        if (err) {
          req.flash("error", err.message);
          res.redirect("back");
        } else {
          // 3. deletes all comments associated with the campground
          Comment.remove({ _id: { $in: foundCampground.comments } }, err => {
            if (err) {
              console.log(err);
              res.redirect("/campgrounds");
            } else {
              // 4. deletes all reviews associated with the campground
              Review.remove({ _id: { $in: foundCampground.reviews } }, function(
                err
              ) {
                if (err) {
                  console.log(err);
                  return res.redirect("/campgrounds");
                }
                // 5. delete the campground
                foundCampground.remove();
                req.flash("success", "Campground deleted successfully!");
                res.redirect("/campgrounds");
              });
            }
          });
        }
      });
    }
  });
});

module.exports = router;
