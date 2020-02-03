require("dotenv").config();
const express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  methodOverride = require("method-override"),
  LocalStrategy = require("passport-local"),
  flash = require("connect-flash"),
  // require User Model
  User = require("./models/user"),
  seedDB = require("./seed");

//require moment
app.locals.moment = require("moment");

const campgroundRoutes = require("./routes/campgrounds"),
  commentRoutes = require("./routes/comments"),
  reviewRoutes = require("./routes/reviews"),
  indexRoutes = require("./routes");

//seedDB();

// connect to DB
mongoose.connect("mongodb://localhost:27017/yelp_camp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// use css
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

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
app.use(async (req, res, next) => {
  res.locals.currentUser = req.user;

  // 如果user login了
  if (req.user) {
    try {
      // 等，直到找到当前user的notification
      let foundUser = await User.findById(req.user.id)
        .populate({ path: "notifications", match: { isRead: false } })
        .exec();
      // 把当前登录的user的没读的notifications放到全局变量中
      res.locals.notifications = foundUser.notifications.reverse();
    } catch (err) {
      console.log(err.message);
    }
  }

  // flash message
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");

  next();
});

//=======================
//    Routes
//=======================
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log("The YelpCamp Server Has Started!");
});
