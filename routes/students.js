const express = require("express");
const router = express.Router();
const students = require("../models/students");
const exams = require("../models/exams");
const questions = require("../models/questions");
const answerOptions = require("../models/answerOptions");
const results = require("../models/results");
const jwt = require("jsonwebtoken");
const jwtKey = "student";

const verifyStudentRole = (req, res, next) => {
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
    console.log("token", req.headers);
    //verify the JWT token generated for the user
    jwt.verify(req.token, jwtKey, (err, authorizedData) => {
        if (err) {
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

router.post("/getExam", verifyStudentRole, async (req, res) => {
    let examId = req.body.examId;

    let examObject;
    await exams.getExamById(examId, {
        then: result => {
            examObject = { ...result[0] };
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })
        .catch(err => res.status(500).json({ code: 0, err }))

    let questionList = examObject.questionsList.split(",");
    let questionArray;
    await questions.getQuestionsByQuestionsList(questionList, {
        then: result => {
            questionArray = result;
            //console.log(result)
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })
        .catch(err => res.status(500).json({ code: 0, err }))

    let answerOptionsArray;
    await answerOptions.getAnswerOptionsByQuestionsList(questionList, {
        then: result => {
            answerOptionsArray = result;
            console.log(result)
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })
        .catch(err => res.status(500).json({ code: 0, err }))

    let compleExamObject = {
        examId: examId,
        questionList: []
    };

    questionArray.forEach(x => compleExamObject.questionList.push({
        question: x.question,
        questionId: x.id,
        answerOptions: []
    }))

    for (let i = 0; i < questionArray.length; i++) {
        for (let k = 0; k < answerOptionsArray.length; k++) {
            if (questionArray[i].id === answerOptionsArray[k].questionId) {
                compleExamObject.questionList[i].answerOptions.push(answerOptionsArray[k])
            }
        }
    }

    res.json(compleExamObject);
})

router.post("/returnExam", verifyStudentRole, async (req, res) => {
    let examId = req.body.examId;
    let studentId = req.body.studentId;
    let answers = req.body.answers;

    let resultObject;
    let studentAnswerObject;
    let score = 0;

    let examObject;
    await exams.getExamById(examId, {
        then: result => {
            examObject = { ...result[0] };
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })
        .catch(err => res.status(500).json({ code: 0, err }))

    let questionList = examObject.questionsList.split(",");
    let questionArray;
    await questions.getQuestionsByQuestionsList(questionList, {
        then: result => {
            questionArray = result;
            //console.log(result)
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })
        .catch(err => res.status(500).json({ code: 0, err }))

    for (let i = 0; i < answers.length; i++) {
        for (let k = 0; k < questionArray.length; k++) {
            if (answers[i].questionId == questionArray[k].id
                && answers[i].answerNo == questionArray[k].correctAnswerNo) {
                    score ++;
            }
        }
    }

    resultObject = {
        examId: examId,
        studentId: studentId,
        score: score+"/"+questionArray.length,
        date: Date().toString()
    };

    await results.create(resultObject, {
        then: () => {},
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })

    //console.log(questionArray);
    console.log(resultObject);
    res.sendStatus(200)
})

module.exports = router;