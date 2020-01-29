const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");

router.get("/", (req, res) => {
  res.render("landing");
});
//=======================
//  Register Get Route
//=======================
router.get("/register", (req, res) => {
  res.render("register");
});
//=======================
//  Register Post Route
//=======================
router.post("/register", (req, res) => {
  const { username, password } = req.body;
  // User.register是plm的方法，第一个参数放一个user object，第二个参数放密码，plm自己加密它，第三个参数是callback，返回一个user里面是用户名和为用户加密的密码
  User.register(new User({ username: username }), password, (err, user) => {
    if (err) {
      req.flash("error", err.message);
      return res.render("register");
    }
    // plm的方法，注册成功之后重定向
    passport.authenticate("local")(req, res, () => {
      req.flash("success", "Welcome to YelpCamp " + user.username);
      res.redirect("/campgrounds");
    });
  });
});

//=======================
//  Login Get Route
//=======================
router.get("/login", (req, res) => {
  res.render("login");
});

//=======================
//  Login Post Route
//=======================
router.post(
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
router.get("/logout", (req, res) => {
  req.logout();
  // flash
  req.flash("success", "Logged you out!");
  res.redirect("/campgrounds");
});

module.exports = router;
