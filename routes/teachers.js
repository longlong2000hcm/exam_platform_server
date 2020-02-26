const express = require("express");
const router = express.Router();
const teachers = require("../models/teachers");
const questions = require("../models/questions");
const answerOptions = require("../models/answerOptions");
const jwt = require("jsonwebtoken");
const jwtKey = "teacher";

const verifyTeacherRole = (req, res, next) => {
    jwt.verify(req.token, jwtKey, (err, authorizedData) => {
        if (err) {
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

router.post("/", function (req, res) {
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

router.post("/addQuestion", verifyTeacherRole, async (req, res) => {
    let questionId;
    let results = req.body;
    const createQuestion = await questions.create(req.body, {
        then: rows => {
            questionId = rows[0];
            req.body.id = questionId;
        },
        catch: err => {
            res.status(500);
            return null;
        }
    });
    const createAnswerOptions = await answerOptions.create(req.body.answerOptions, questionId, {
        then: rows => {
            for (let i = 0; i < rows.length; i++) {
                results.answerOptions[i].id = rows[i];
            }
            res.status(201).json(results);
        },
        catch: err => err
    })
});

module.exports = router;