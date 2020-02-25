const express = require("express");
const router = express.Router();
const teachers = require("../models/teachers");
const jwt = require("jsonwebtoken");
const jwtKey = "teacher";

const verifyTeacherRole = (req,res,next) => {
    jwt.verify(req.token, jwtKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            res.sendStatus(403);
            return null;
        } else {
            next();
        }
    })
}

router.get('/', (req, res) => {
    teachers.get({
        then: rows => {
            res.status(202).json({ code: 1, rows });
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })
})

router.post("/", function(req, res) {
    teachers.create(req.body, {
      then: rows => {
        res.status(201).json({ code: 1, rows });
      },
      catch: err => {
        res.status(500).json({ code: 0, err });
      }
    });
  });

router.post("/login", async function (req, res, next) {
    const data = await teachers.login(req.body);
    if (data.code == 1) {
        res
            .status(200)
            .header("x-auth-token", data.token)
            .json({ ...data });
    } else {
        res.status(400).json({ ...data });
    }
});

module.exports = router;