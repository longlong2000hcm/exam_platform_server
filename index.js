const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bearerToken = require('express-bearer-token');

const app = express();
let port = process.env.PORT;
if (port == null || port == "") {
  port = 4000;
}

app.use(cors());
app.use(bearerToken());
app.use(bodyParser.json());


const studentsRoute =  require("./routes/students");
const teachersRoute =  require("./routes/teachers");

//app.use('/',(req,res)=>res.send("Hello"));
app.use('/students', studentsRoute);
app.use('/teachers', teachersRoute);

app.listen(port, () => {
    console.log(`API listening on PORT ${port}\n`);
})