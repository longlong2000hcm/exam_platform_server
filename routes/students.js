const express = require("express");
const router = express.Router();
const students = require("../models/students");
const exams = require("../models/exams");
const questions = require("../models/questions");
const answerOptions = require("../models/answerOptions");
const results = require("../models/results");
const studentAnswers = require("../models/studentAnswers");
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
            return null;
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
            return null;
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
            return null;
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
            return null;
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
            return null;
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
    let studentAnswerArray = [];
    let score = 0;

    let examObject;
    await exams.getExamById(examId, {
        then: result => {
            examObject = { ...result[0] };
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
            return null;
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
            return null;
        }
    })
        .catch(err => res.status(500).json({ code: 0, err }))

    for (let i = 0; i < answers.length; i++) {
        for (let k = 0; k < questionArray.length; k++) {
            if (answers[i].questionId == questionArray[k].id
                && answers[i].answerNo == questionArray[k].correctAnswerNo) {
                score++;
            }
        }
    }

    resultObject = {
        examId: examId,
        studentId: studentId,
        score: score + "/" + questionArray.length,
        date: Date().toString()
    };


    let resultId;
    await results.create(resultObject, {
        then: rows => { resultId = parseInt(...rows) },
        catch: err => {
            res.status(500).json({ code: 0, err });
            return null;
        }
    })

    for (let i = 0; i < answers.length; i++) {
        for (let k = 0; k < questionArray.length; k++) {
            if (answers[i].questionId == questionArray[k].id) {
                studentAnswerArray.push({
                    resultId: resultId,
                    questionId: questionArray[k].id,
                    studentAnswer: answers[i].answerNo,
                    correctAnswer: questionArray[k].correctAnswerNo
                })
            }
        }
    }

    await studentAnswers.create(studentAnswerArray, {
        then: rows => rows,
        catch: err => {
            res.status(500).json({ code: 0, err });
            return null;
        }
    })

    await students.removeExam(studentId, examId, {
        then: rows => rows,
        catch: err => {
            res.status(500).json({ code: 0, err });
            return null;
        }
    })

    //console.log(questionArray);
    //console.log(resultObject);
    //console.log(studentAnswerArray);

    //This part will compare the results and send it back to the student
    let singleResult;
    await results.getResultById(resultId, {
        then: rows => {
            singleResult = rows;
            //console.log(singleResult);
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
            return null;
        }
    })

    let studentData;
    await students.getStudentById(singleResult[0].studentId, {
        then: rows => {
            studentData = rows;
            //console.log(studentData[0]);
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
            return null;
        }
    })
    singleResult[0].studentUsername = studentData[0].username;

    let studentAnswersData;
    await studentAnswers.getStudentAnswersByResultsId(singleResult[0].id, {
        then: rows => {
            studentAnswersData = rows;
            //console.log(studentAnswersData);
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
            return null;
        }
    })

    let qList = [];
    studentAnswersData.forEach(e => {
        qList.push(e.questionId);
    });
    let answerOptionsArray;
    await answerOptions.getAnswerOptionsByQuestionsList(qList, {
        then: result => {
            answerOptionsArray = result;
            //console.log(result)
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })
        .catch(err => res.status(500).json({ code: 0, err }))

    for (let i = 0; i < studentAnswersData.length; i++) {
        for (let k = 0; k < answerOptionsArray.length; k++) {
            if (studentAnswersData[i].questionId == answerOptionsArray[k].questionId) {
                if (studentAnswersData[i].studentAnswer == answerOptionsArray[k].answerNo) {
                    studentAnswersData[i].studentAnswerContent = answerOptionsArray[k].answer;
                }
                if (studentAnswersData[i].correctAnswer == answerOptionsArray[k].answerNo) {
                    studentAnswersData[i].correctAnswerContent = answerOptionsArray[k].answer;
                }
            }
        }
    }

    singleResult[0].studentAnswers = studentAnswersData;

    res.status(200).json({ code: 1, results: singleResult });
    //res.sendStatus(200)
})

router.post("/pendingExams", verifyStudentRole, async (req, res) => {
    let studentsPendingExamsArray;
    await students.getStudentById(req.body.id, {
        then: rows => {
            studentsPendingExamsArray = rows[0].pendingExams.split(",");
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
            return null;
        }
    })
    let examsArray;
    await exams.get({
        then: rows => {
            examsArray = rows;
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
            return null;
        }
    })

    let pendingExams = [];
    //console.log(studentsArray)
    //console.log(examsArray)
    for (let i = 0; i < studentsPendingExamsArray.length; i++) {
        for (let k = 0; k < examsArray.length; k++) {
            if (studentsPendingExamsArray[i] == examsArray[k].id) {
                pendingExams.push({ id: examsArray[k].id, name: examsArray[k].name, numberOfQuestions: examsArray[k].questionsList.split(",").length })
            }
        }
    }
    res.status(200).json(pendingExams);
})

module.exports = router;