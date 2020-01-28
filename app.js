const express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  // require User Model
  User = require("./models/user"),
  seedDB = require("./seed");

const campgroundRoutes = require("./routes/campgrounds"),
  commentRoutes = require("./routes/comments"),
  indexRoutes = require("./routes");

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
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log("The YelpCamp Server Has Started!");
});
