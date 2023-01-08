const express = require("express")
const cors = require("cors")
const app = express();
require("dotenv").config({ path: "./config.env"})
const port = process.env.PORT;
const dbo = require("./db/conn.js");
const cookieParser = require("cookie-parser");

app.use(cors({ 
  origin: 'https://saveredd.onrender.com',
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' }));

app.use(express.json());
app.use(cookieParser());

// app.use((req, res, next) => {
//   res.append('Access-Control-Allow-Origin', ['*']);
//   res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   res.append('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });
// app.use(decodeToken); use for all routes or only some?
app.use(require("./routes/routing.js"));


// const middleware = require("./middleware/index");

app.listen(80, () => {
  dbo.connectToServer(function (err) {
    if (err) console.log(err);
  })
  console.log(`Server connected to port: ${port}`);
})