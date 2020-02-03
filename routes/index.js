const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Campground = require("../models/campground");
const Notification = require("../models/notification");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const async = require("async");
const middleware = require("../middleware");

router.get("/", (req, res) => {
  res.render("landing");
});
//=======================
//  Register Get Route
//=======================
router.get("/register", (req, res) => {
  res.render("register", { page: "register" });
});
//=======================
//  Register Post Route
//=======================
router.post("/register", (req, res) => {
  const newUserObject = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    avatar: req.body.avatar
  });
  // check if user is admin before register to DB
  if (req.body.adminCode === "lizhen") {
    newUserObject.isAdmin = true;
  }
  // User.register是plm的方法，第一个参数放一个user object但只是不要放密码，第二个参数放密码，plm自己hash它，第三个参数是callback，返回一个user里面是用户名和为用户加密的密码
  User.register(newUserObject, req.body.password, (err, user) => {
    if (err) {
      req.flash("error", err.message);
      //res.render("register", { error: err.message });
      res.redirect("/register");
    } else {
      // plm的方法，注册成功之后重定向
      passport.authenticate("local")(req, res, () => {
        req.flash("success", "Welcome to YelpCamp " + user.username);
        res.redirect("/campgrounds");
      });
    }
  });
});

//=======================
//  Login Get Route
//=======================
router.get("/login", (req, res) => {
  res.render("login", { page: "login" });
});

//=======================
//  Login Post Route
//=======================
router.post(
  "/login",
  // 这是middleware
  passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Logged in!"
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

//=======================
//  User Profile Get Route
//=======================
router.get("/users/:id", (req, res) => {
  User.findById(req.params.id, (err, foundUser) => {
    if (err) {
      req.flash("error", "Something went wrong!");
      res.redirect("/");
    } else {
      Campground.find()
        .where("author.id")
        .equals(foundUser.id)
        .exec((err, usersCampgrounds) => {
          if (err) {
            req.flash("error", "Something went wrong!");
            res.redirect("/");
          } else {
            res.render("users/show", {
              campgrounds: usersCampgrounds,
              user: foundUser
            });
          }
        });
    }
  });
});

//=========================
// Forgot Password Get
//=========================
router.get("/forgot", function(req, res) {
  res.render("forgot");
});

//=========================
// Forgot Password Post
//=========================
router.post("/forgot", function(req, res, next) {
  async.waterfall(
    [
      // 第一个function的目的是用nodejs自带的crypto生成一个token
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          if (err) throw err;
          var token = buf.toString("hex");
          done(err, token);
        });
      },

      // 第二个function拿到第一个function的token，再通过email去找user
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (err) throw err;
          // 如没有找到对应的user
          if (!user) {
            req.flash("error", "No account with this email address exists!");
            return res.redirect("/forgot");
          }
          // 找到了对应的user, 把token和过期时间放入user的数据库中
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
          // 保存user
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },

      // 第三个function 拿到第二个function传来的user和token，开始发邮件
      function(token, user, done) {
        var transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: "uowyuchen@gmail.com", // generated ethereal user
            pass: process.env.GMAILPW // generated ethereal password
          },
          tls: {
            //这个是从localhost发邮件需要用的
            rejectUnauthorized: false
          }
        });
        var mailOptions = {
          to: user.email,
          from: "uowyuchen@gmail.com",
          subject: "YelpCamp Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n"
        };
        // 发送邮件
        transporter.sendMail(mailOptions, function(err) {
          console.log("reset link mail sent");
          req.flash(
            "success",
            "An e-mail has been sent to " +
              user.email +
              " with further instructions."
          );
          done(err, "done");
        });
      } // 结束上面的waterfall
    ],
    function(err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});
//=========================
// Reset Password Get
//=========================
router.get("/reset/:token", function(req, res) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    },
    function(err, user) {
      if (err) throw err;
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired!");
        return res.redirect("/forgot");
      }
      res.render("reset", { token: req.params.token });
    }
  );
});

//=========================
// Reset Password Post
//=========================
router.post("/reset/:token", function(req, res) {
  async.waterfall(
    [
      // function 1, 执行后将改了密码的user传给下一个function
      function(done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
          },
          function(err, user) {
            if (err) throw err;
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired!"
              );
              return res.redirect("back");
            }
            if (req.body.password === req.body.confirm) {
              // passport-local-mongoose提供的方法set一个password
              user.setPassword(req.body.password, function(err) {
                if (err) throw err;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function(err) {
                  if (err) throw err;
                  // 这是passport.js的方法
                  req.login(user, function(err) {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Password do not match!");
              return res.redirect("back");
            }
          }
        );
      },
      // function 2, 拿到function 1传来的user object， 给这个user发邮件通知密码已经改了！
      function(user, done) {
        var transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: "uowyuchen@gmail.com", // generated ethereal user
            pass: process.env.GMAILPW // generated ethereal password
          },
          tls: {
            //这个是从localhost发邮件需要用的
            rejectUnauthorized: false
          }
        });
        var mailOptions = {
          to: user.email,
          from: "uowyuchen@gmail.com",
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n"
        };
        // 发送邮件
        transporter.sendMail(mailOptions, function(err) {
          // console.log('mail sent');
          req.flash("success", "Success! Your password has been changed!");
          done(err);
        });
      }
      // 结束上面的waterfall
    ],
    function(err) {
      if (err) throw err;
      res.redirect("/campgrounds");
    }
  );
});

//=========================
// Follow User Get Route
//=========================
router.get("/follow/:id", middleware.isLoggedin, async (req, res) => {
  // follow其他人:其实就是通过follow button中那个人的id，通过数据库找到那个人
  // 把自己的id放进那个人的follower中。那个人的user model中的follower就有自己了
  try {
    let user = await User.findById(req.params.id); // 找到要follow的人
    user.followers.push(req.user.id); // 把自己的id放进要follow的那个人的user model中
    user.save();
    req.flash("success", "Successfully followed " + user.username + "!");
    // 返回到当前页面
    res.redirect("/users/" + req.params.id);
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

//=========================
// Show Notifications Get Route
//=========================
router.get("/notifications/", async (req, res) => {
  try {
    // 找到当前登录的user
    let user = await User.findById(req.user.id)
      .populate({
        path: "notifications",
        options: { sort: { _id: -1 } }
      })
      .exec();
    // 找到当前登录的user的所有的notifications
    let allNotifications = user.notifications;
    res.render("notifications/index", { allNotifications });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

//=========================
// Handle New Notifications Get Route
//=========================
router.get("/notifications/:id", async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/campgrounds/${notification.campgroundId}`);
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

module.exports = router;
