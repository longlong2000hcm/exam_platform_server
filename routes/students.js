const express = require("express");
const router = express.Router();
const students = require("../models/students");
const jwt = require("jsonwebtoken");
const jwtKey = "student";


router.get('/', (req, res) => {
    students.get({
        then: rows => {
            res.status(202).json({ code: 1, rows });
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })
})

router.post("/", function (req, res) {
    students.create(req.body, {
        then: rows => {
            res.status(201).json({ code: 1, rows });
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    });
});

router.post("/login", async function (req, res, next) {
    const data = await students.login(req.body);
    if (data.code == 1) {
        res
            .status(200)
            .header("x-auth-token", data.token)
            .json({ ...data });
    } else {
        res.status(400).json({ ...data });
    }
});

router.post("/protected", async function (req, res, next) {
    console.log("token",req.headers);
    //verify the JWT token generated for the user
    jwt.verify(req.token, jwtKey, (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            console.log('ERROR: Could not connect to the protected route');
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data 
            // res.json({
            //     message: 'Successful log in',
            //     authorizedData
            // });
            res.send("authorized")
            console.log('SUCCESS: Connected to protected route');
        }
    })
});

module.exports = router;