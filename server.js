const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const ws = require("express-ws");
const path = require("path");
const ejs = require("ejs");
const mysql = require("mysql");
const app = express();
ws(app);

const port = 8080;

//Struttura database
//accountdb
//|-Accounts
//  |-id
//  |-username
//  |-password
//

var connection = mysql.createConnection({
  host: "localhost", //"IPCasa:3306"
  user: "root",
  password: "",
  database: "accountsdb",
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/", express.static(__dirname + "/views"));
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "test",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // In un ambiente di produzione, imposta a true in caso di HTTPS
  })
);

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    // L'utente è autenticato, procedi all'endpoint successivo
    return next();
  } else {
    // L'utente non è autenticato, reindirizzalo alla pagina di login
    res.redirect("/loginPage");
  }
}
function isNotAuthenticated(req, res, next) {
  if (!req.session.user) {
    // L'utente non è autenticato, procedi all'endpoint successivo
    return next();
  } else {
    // L'utente è già autenticato, reindirizzalo alla pagina protetta
    res.redirect("/");
  }
}

app.get("/", isAuthenticated, (req, res) => {
  res.render("index.ejs");
});

app.get("/loginPage", isNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.get("/registerPage", isNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.post("/login", isNotAuthenticated, (req, res) => {
  const { username, password, remember } = req.body;
  query = "SELECT * FROM accounts WHERE username = ? AND password = ?";

  connection.query(query, [username, password], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      const user = result[0];
      req.session.user = user.id;
      req.session.username = user.username;

      if (remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 giorni
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 gg
      }

      res.redirect("/");
    } else {
      res.redirect("/loginPage");
    }
  });
});

app.post("/register", isNotAuthenticated, (req, res) => {
  const { username, password } = req.body;
  query = "SELECT * FROM accounts WHERE username = ? AND password = ?";

  connection.query(query, [username, password], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      res.redirect("/register");
    } else {
      query = `INSERT INTO accounts (username,password) VALUES ('${username}','${password}')`;
      connection.query(query, (err, result) => {
        if (err) throw err;
        else console.log("Utente inserito");
      });
      res.redirect("/loginPage");
    }
  });
});

const activeConnections = new Map();

app.ws("/ws", (ws, req) => {
  const userId = req.session.user;
  const username = req.session.username;
  var message;

  if (!userId) {
    ws.close();
    return;
  }

  activeConnections.set(userId, { ws: ws, username: username });

  ws.on("message", (data) => {
    Id = userId;
    console.log(`Ricevuto messaggio da utente ${userId} di username: ${data}`);
    activeConnections.forEach((client, id) => {
      message = [username, data];
      client.ws.send(JSON.stringify(message));
    });
  });

  ws.on("close", () => {
    // Rimuovi la connessione dalla lista quando il client si disconnette
    activeConnections.delete(userId);

    console.log(`Connessione WebSocket chiusa per il client con ID ${userId}.`);
  });
});
app.listen(port, () => {
  console.log(`hey, listen! ${port}`);
});
