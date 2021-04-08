const express = require("express");
const app = express();
const server = require("http").createServer(app);
const path = require("path");
const flash = require("connect-flash");

const userModel = require("./models/user.model");

const socketIO = require("socket.io");
const io = socketIO(server);
require("./sockets/friend.socket")(io);
require("./sockets/init.socket")(io);
require("./sockets/chat.socket")(io);
require("./sockets/group.socket")(io);
io.onlineFriends = {};

const authRouter = require("./routes/auth.route");
const homeRouter = require("./routes/home.route");
const profileRouter = require("./routes/profile.route");
const friendRouter = require("./routes/friend.route");
const chatRouter = require("./routes/chat.route");
const msgsRouter = require("./routes/messages.route");
const groupRouter = require("./routes/group.route");

app.use(express.static(path.join(__dirname, "assets")));
app.use(express.static(path.join(__dirname, "imgs")));

app.set("view engine", "ejs");
app.set("views", "views");

const session = require("express-session");
const SessionStore = require("connect-mongodb-session")(session);
const Store = new SessionStore({
  uri:
    "mongodb+srv://abdelrazek:abdelrazek@cluster0.qcugc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  collection: "sessions",
});
app.use(
  session({
    secret: "my name is abdelrazek ali",
    store: Store,
    saveUninitialized: false,
    resave: true,
  })
);

app.use(flash());

app.use((req, res, next) => {
  let id = req.session.userId;
  if (id) {
    userModel
      .getFriendRequests(id)
      .then((requests) => {
        req.friendRequests = requests;
        next();
      })
      .catch((err) => {
        // res.redirect("/error");
        console.log(err);
      });
  } else {
    next();
  }
});

app.use(homeRouter);
app.use(authRouter);
app.use("/profile", profileRouter);
app.use("/friend", friendRouter);
app.use("/chat", chatRouter);
app.use("/messages", msgsRouter);
app.use("/groups", groupRouter);
app.get("/error", (req, res, next) => {
  res.status(500);
  res.render("error", {
    isUser: req.session.userId,
    profileName: req.session.name,
    friendRequests: req.friendRequests,
    pageTitle: "Error",
  });
});

app.use((req, res) => {
  res.status(404);
  res.render("notFound", {
    isUser: req.session.userId,
    profileName: req.session.name,
    friendRequests: req.friendRequests,
    pageTitle: "Not Found",
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log("Server is listen on port " + port);
});