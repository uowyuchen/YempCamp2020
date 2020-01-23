const express = require("express");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const campgrounds = [
  {
    name: "Salmon Creek",
    image: "https://farm9.staticflickr.com/8442/7962474612_bf2baf67c0.jpg"
  },
  {
    name: "Granite Hill",
    image: "https://farm1.staticflickr.com/60/215827008_6489cd30c3.jpg"
  },
  {
    name: "Mountain Goat's Rest",
    image: "https://farm7.staticflickr.com/6057/6234565071_4d20668bbd.jpg"
  },
  {
    name: "Salmon Creek",
    image: "https://farm9.staticflickr.com/8442/7962474612_bf2baf67c0.jpg"
  },
  {
    name: "Granite Hill",
    image: "https://farm1.staticflickr.com/60/215827008_6489cd30c3.jpg"
  },
  {
    name: "Mountain Goat's Rest",
    image: "https://farm7.staticflickr.com/6057/6234565071_4d20668bbd.jpg"
  },
  {
    name: "Salmon Creek",
    image: "https://farm9.staticflickr.com/8442/7962474612_bf2baf67c0.jpg"
  },
  {
    name: "Granite Hill",
    image: "https://farm1.staticflickr.com/60/215827008_6489cd30c3.jpg"
  },
  {
    name: "Mountain Goat's Rest",
    image: "https://farm7.staticflickr.com/6057/6234565071_4d20668bbd.jpg"
  }
];

app.get("/", (req, res) => {
  res.render("landing");
});

app.get("/campgrounds", (req, res) => {
  res.render("campgrounds", { campgrounds: campgrounds });
});

app.post("/campgrounds", (req, res) => {
  // get data from form and add to campgrounds array
  const name = req.body.name;
  const image = req.body.image;
  const newCampgrounds = { name, image };
  campgrounds.unshift(newCampgrounds);
  // redirect back to campgrounds page
  res.redirect("/campgrounds");
});

app.get("/campgrounds/new", (req, res) => {
  res.render("new");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("The YelpCamp Server Has Started!");
});
