const express = require('express');
const app = express();
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
var csrf = require("tiny-csrf");
const user = require('./models/user');
const flash = require("connect-flash");
const session = require("express-session");

app.use(cookieParser("ssh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash());
app.use(
  session({
    secret: "my-super-secret-key-7643643789328",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);




const { User } = require("./models");

//set ejs as view engine
app.set("view engine", "ejs");

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});




app.get("/", async (request, response) => {
  response.render("index", {
    title: "Sports Scheduler",
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", async (request, response) => {
    response.render("signup", {title: "Signup",csrfToken: request.csrfToken(),});
  });

  app.get("/login", (request, response) => {
    response.render("login", { title: "Login", csrfToken: request.csrfToken() });
  });

  app.post("/createSession", async (request, response) => {
    if (request.body.firstName.length == 0) {
      request.flash("error", "Please, Fill the First name!");
      return response.redirect("/signup");
    }
    if (request.body.email.length == 0) {
      request.flash("error", "Please, Fill the E-Mail!");
      return response.redirect("/signup");
    }
    if (request.body.password.length == 0) {
      request.flash("error", "Please, Fill the Password!");
      return response.redirect("/signup");
    }
    //Creating a user
    try {
      const user = await User.create({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        password: request.body.password,
        role: "player"
      });
      response.render("createSession");
    } catch (error) {
      console.log(error);
      return response.redirect("/signup");
    }
  });

  app.get("/createSport", (request, response) => {
    response.render("createSport");
  });



  // app.post("/users", async (request, response) => {
  //   response.render("admin", { title: "users", csrfToken: request.csrfToken() });
  // });

module.exports = app;