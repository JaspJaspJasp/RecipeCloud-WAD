//Dependencies
const path = require("path");
const express = require("express");
const mongoose = require('mongoose');
const session = require("express-session");
const dotenv = require('dotenv');

//Server side initialisation
const app = express();
const hostname = "127.0.0.1";
const port = 8000;

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

//Database String
dotenv.config({path: './config.env'}); 

//Database connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

//Post, Public routing, EJS initialisation
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//session
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

//Routes
const recipes = require('./routes/recipes'); 
const register = require('./routes/register');
const login = require('./routes/login');
const shoplist = require("./routes/shop");
const forum = require("./routes/forum");
const favouriteRoutes = require('./routes/favourites');

//Routings
app.use("/", recipes); 
app.use("/", register); 
app.use("/", login); 
app.use("/", shoplist);
app.use("/", forum);
app.use('/', favouriteRoutes);





function startServer() {
  app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

connectDB().then(startServer);

