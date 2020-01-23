const express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  Camground = require("./models/campground"),
  Comment = require("./models/comment"),
  seedDB = require("./seed");

//seedDB();

mongoose.connect("mongodb://localhost:27017/yelp_camp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// use css
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("landing");
});

// Index - show all campgrounds
app.get("/campgrounds", (req, res) => {
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
app.post("/campgrounds", (req, res) => {
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
app.get("/campgrounds/new", (req, res) => {
  res.render("campgrounds/new");
});

// Show - show more info about one campground
app.get("/campgrounds/:id", (req, res) => {
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

//=========================
//  comments routes: new
//=========================
app.get("/campgrounds/:id/comments/new", (req, res) => {
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
app.post("/campgrounds/:id/comments", (req, res) => {
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

app.listen(process.env.PORT || 3000, () => {
  console.log("The YelpCamp Server Has Started!");
});
