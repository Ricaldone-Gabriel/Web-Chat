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

app.post("/login", isNotAuthenticated, (req, res) => {
  const { username, password, remember } = req.body;
  query = "SELECT * FROM account WHERE Username = ? AND Password = ?";

  connection.query(query, [username, password], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      const user = result[0];
      req.session.user = user.Id;

      if (remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 giorni
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 gg
      }

      res.redirect("/");
    }
  });
});

const activeConnections = new Map();

app.ws("/ws", (ws, req) => {
  const userId = req.session.user;
  // Aggiungi i tuoi gestori di eventi WebSocket qui...
  if (!clientId) {
    // Se l'ID unico non è presente, chiudi la connessione
    ws.close();
    return;
  }

  activeConnections.set(clientId, ws);

  ws.send(`Benvenuto! Il tuo ID è: ${clientId}`);

  ws.on("message", (message) => {
    console.log(`Ricevuto messaggio da utente ${userId}: ${message}`);
    // Puoi fare qualcosa con l'ID utente, ad esempio inviare un messaggio solo a quel particolare utente
    // ws.send(`Utente ${userId} ha detto: ${message}`);
  });
});

app.listen(port, () => {
  console.log(`hey, listen! ${port}`);
});

/*
const express = require('express');
const expressWs = require('express-ws');

const app = express();
expressWs(app);

// Lista delle connessioni attive con i rispettivi ID utente
const activeConnections = new Map();

app.ws('/ws', (ws, req) => {
  // Genera un ID univoco per il nuovo client
  const clientId = generateUniqueId();

  // Associa l'ID utente alla connessione WebSocket
  activeConnections.set(clientId, ws);

  // Invia l'ID unico al client quando si connette
  ws.send(JSON.stringify({ type: 'clientId', clientId }));

  // Aggiungi altri gestori di eventi WebSocket qui...
  console.log(`Client con ID ${clientId} collegato.`);

  ws.on('message', (message) => {
    console.log(`Ricevuto messaggio dal client ${clientId}: ${message}`);
    // Puoi aggiungere la logica per gestire i messaggi inviati dal client
  });

  ws.on('close', () => {
    // Rimuovi la connessione dalla lista quando il client si disconnette
    activeConnections.delete(clientId);

    console.log(`Connessione WebSocket chiusa per il client con ID ${clientId}.`);
  });
});

function generateUniqueId() {
  // Implementa la tua logica per generare un ID univoco (ad esempio, usando una libreria come 'uuid')
  // In questo esempio, viene utilizzata una semplice combinazione di timestamp e un numero casuale
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

const port = 3000;
app.listen(port, () => {
  console.log(`Server avviato su http://localhost:${port}`);
});
Lato client (HTML/JavaScript):

html
Copy code
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebSocket Client</title>
</head>
<body>
    <div>
        A
    </div>
    <script>
        const webSocket = new WebSocket('ws://localhost:3000/ws');

        webSocket.addEventListener('open', (event) => {
            console.log('Connessione WebSocket aperta.');
        });

        webSocket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'clientId') {
                const clientId = data.clientId;
                console.log(`Il tuo ID unico è: ${clientId}`);

                // Puoi fare qualcosa con l'ID unico del client
            } else {
                // Altri tipi di messaggi possono essere gestiti qui
                console.log('Messaggio dal server:', event.data);
            }
        });

        webSocket.addEventListener('close', (event) => {
            console.log('Connessione WebSocket chiusa.');
        });

        webSocket.addEventListener('error', (event) => {
            console.error('Errore nella connessione WebSocket:', event);
        });
    </script>
</body>
</html>
*/
