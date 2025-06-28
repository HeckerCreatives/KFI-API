require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const port = process.env.PORT || 5005;
const http = require("http");
const { database } = require("./configs/database");
const { routers } = require("./routes");
const globalErrorHandler = require("./middlewares/globar-err.js");
const passport = require("passport");
const corsConfig = require("./configs/cors");
const path = require("path");

const app = express();
app.use(cors(corsConfig));

app.use(morgan("dev"));
app.use(passport.initialize());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

global.rootDir = path.resolve(__dirname);

const server = http.createServer(app);

require("./configs/passport.js");
routers(app);

app.use(globalErrorHandler);

server.listen(port, () => {
  database();
  console.log(`Server is running on port: ${port}`);
});
