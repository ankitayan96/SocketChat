const fs = require("fs");
const http = require("http");
var path = require("path");
const APP_PORT = process.env.APP_PORT || 3000;
let filePath = "";
const requestHandler = (request, response) => {
  console.log(`Recieved request: ${request.url}`);
  filePath = "./client" + request.url;
  console.log(filePath);
  if (filePath == "./client/") {
    filePath = "./client/index.html";
  }

  let extname = String(path.extname(filePath)).toLowerCase();

  console.log(`Serving ${filePath}`);

  let mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };

  let contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        fs.readFile("./client/404.html", (error, content) => {
          response.writeHead(404, { "Content-Type": contentType });
          response.end(content, "utf-8");
        });
      } else {
        response.writeHead(500);
        response.end("Sorry,there was an error:" + error.code + "..\n");
      }
    } else {
      response.writeHead(200, { "Content-Type": contentType });
      response.end(content, "utf-8");
    }
  });
};

const app = http.createServer(requestHandler);
const io = require("socket.io")(app, {
  path: "/socket.io",
});

io.attach(app, {
  // includes local domain to avoid CORS error locally
  // configure it accordingly for production
  cors: {
    origin: "http://localhost",
    methods: ["GET", "POST"],
    credentials: true,
    transports: ["websocket", "polling"],
  },
  allowEIO3: true,
});

let users = {};

io.on("connection", (socket) => {
  console.log("New socket connected! >>", socket.id);

  socket.on("new-connection", (data) => {
    console.log(data, "new connectiion event");

    users[socket.id] = data.username;
    console.log(`users ${users}`);
    socket.emit("welcome-message", {
      user: "server",
      message: `Welcome to this Socket.io chat ${data.username}.There are 
      ${Object.keys(users).length} users connected`,
    });
  });

  socket.on("new-message", (data) => {
    console.log(`new-message from ${data.user}`);
    socket.broadcast.emit("broadcast-message", {
      user: users[data.user],
      message: data.message,
    });
  });
});

app.listen(APP_PORT, () => {
  console.log(`Server is running on ${APP_PORT}`);
});
