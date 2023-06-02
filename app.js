const express = require('express');
const app = express();
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
var csrf = require("tiny-csrf");
const user = require('./models/user');
const sport = require('./models/sport');

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;

app.use(cookieParser("ssh! some secret string"));
app.use(
  session({
    secret: "my-super-secret-key-7643643789328",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(err);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});



const { User, Sport } = require("./models");

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

  app.get("/signout", (request, response, next) => {
    request.logout((err) => {
      if (err) {
        return next(err);
      }
      response.redirect("/");
    });
  });

  app.post("/users", async (request, response) => {
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
    const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
    //Creating a user
    try {
      const user = await User.create({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        password: hashedPwd,
        role: "player"
      });
      request.login(user, (err) => {
        if (err) {
          console.log(err);
          res.redirect("/createSession");
        } else {
          request.flash("success", "Sign up successful");
          response.redirect("/createSession");
        }
      });
    } catch (error) {
      console.log(error);
      request.flash("error", "User already Exists");
      return response.redirect("/signup");
    }
  });

  app.post(
    "/session",
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    function (request, response) {
      console.log(request.user);
      if (request.user.role === "admin") {
        response.redirect("/adminpage");
      } else {
      response.redirect("/createSession");
      }
    }
  );



  app.get("/createSession",connectEnsureLogin.ensureLoggedIn(), (request, response) => {
    const UserName = request.user.firstName;
    if (request.accepts("html")) {
    response.render("createSession",{UserName,csrfToken: request.csrfToken()});
    }
    else {
      response.json({UserName,csrfToken: request.csrfToken()});
    }
  });

  app.get("/adminpage",connectEnsureLogin.ensureLoggedIn(), (request, response) => {
    const UserName = request.user.firstName;
    response.render("adminpage",{UserName,csrfToken: request.csrfToken()});
  });

  app.get("/createSport",connectEnsureLogin.ensureLoggedIn(), (request, response) => {
    const UserName = request.user.firstName;
    response.render("createSport",{UserName,csrfToken: request.csrfToken()});
  });

  app.post(
    "/sports",
    async (request, response) => {
      // console.log(request.body);
      // if (request.body.name.length == 0) {
      //   request.flash("error", "Please, Fill the sport!");
      //   return response.redirect("/createSport");
      // }
      try {
        await Sport.addSport({
          name: request.body.name,
        });
        return response.redirect("/adminpage");
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  );


module.exports = app;