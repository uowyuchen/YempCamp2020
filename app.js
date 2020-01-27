const express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  Camground = require("./models/campground"),
  Comment = require("./models/comment"),
  // require User Model
  User = require("./models/user"),
  seedDB = require("./seed");

//seedDB();

// connect to DB
mongoose.connect("mongodb://localhost:27017/yelp_camp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// use css
app.use(express.static(__dirname + "/public"));

//=======================
// Passport Config
//=======================
app.use(
  require("express-session")({
    secret: "any English words",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
// User.authenticate是plm的方法，plm把login的user的密码加密了，所以
// 有了这个，post login的passport.authenticate才好用，不然报错！！！！！！
passport.use(new LocalStrategy(User.authenticate()));
// serialize user & deserialize user是plm的方法
// it's responsible for reading and taking the data from
// the session that's encode it and unecode it
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// 顺序很重要：必须要在passport配置的后面
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  console.log(req.user);
  next();
});

//=======================
//    Routes
//=======================
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
app.get("/campgrounds/:id/comments/new", isLoggedin, (req, res) => {
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
app.post("/campgrounds/:id/comments", isLoggedin, (req, res) => {
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
//  Auth Routes
//=======================
//=======================
//  Register Get Route
//=======================
app.get("/register", (req, res) => {
  res.render("register");
});
//=======================
//  Register Post Route
//=======================
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  // User.register是plm的方法，第一个参数放一个user object，第二个参数放密码，plm自己加密它，第三个参数是callback，返回一个user里面是用户名和为用户加密的密码
  User.register(new User({ username: username }), password, (err, user) => {
    if (err) {
      console.log(err);
      return res.render("register");
    }
    // plm的方法，注册成功之后重定向
    passport.authenticate("local")(req, res, () => {
      res.redirect("/campgrounds");
    });
  });
});

//=======================
//  Login Get Route
//=======================
app.get("/login", (req, res) => {
  res.render("login");
});

//=======================
//  Login Post Route
//=======================
app.post(
  "/login",
  // 这是middleware
  passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
  }),
  (req, res) => {}
);

//=======================
//  Logout Get Route
//=======================
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/campgrounds");
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
app.listen(process.env.PORT || 3000, () => {
  console.log("The YelpCamp Server Has Started!");
});
