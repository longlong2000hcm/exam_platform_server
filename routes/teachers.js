const express = require("express");
const router = express.Router();
const teachers = require("../models/teachers");
const students = require("../models/students");
const questions = require("../models/questions");
const answerOptions = require("../models/answerOptions");
const exams = require("../models/exams");
const results = require("../models/results");
const studentAnswers = require("../models/studentAnswers");
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

router.get("/getQuestions", verifyTeacherRole, async (req,res) => {
    questions.get({
        then: rows => {
            res.status(202).json({ code: 1, rows });
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })
})

router.post("/createExam", verifyTeacherRole, async (req, res) => {
    let createExamResult;
    let createExam = await exams.create(req.body, {
        then: rows => {
            console.log("examId: ", ...rows)
            createExamResult = parseInt(...rows);
            return parseInt(...rows);
            //res.status(201).json({ code: 1, rows });
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    });
    console.log("createExamResult: ", createExamResult);
    if (createExamResult) {
        let assignExam = await students.assignExam(req.body.target, createExamResult, {
            then: rows => {
                res.status(201).json({ code: 1, rows });
            },
            catch: err => {
                res.status(500).json({ code: 0, err });
            }
        })
    }
})

router.get("/examResults/:resultsId?", verifyTeacherRole, async (req, res) => {
    if (!req.params.resultsId) {
        let resultsArray;
        await results.get({
            then: rows => {
                resultsArray = rows;
                //console.log(resultsArray);
            },
            catch: err => {
                res.status(500).json({ code: 0, err });
                return null;
            }
        })
        let studentsArray;
        await students.get({
            then: rows => {
                studentsArray = rows;
                //console.log(studentsArray);
            },
            catch: err => {
                res.status(500).json({ code: 0, err });
                return null;
            }
        })
        for (let i = 0; i < resultsArray.length; i++) {
            for (let k = 0; k < studentsArray.length; k++) {
                if (resultsArray[i].studentId == studentsArray[k].id) {
                    resultsArray[i].studentUsername = studentsArray[k].username;
                }
            }
        }
        res.status(200).json({ code: 1, resultsArray });
    }
    else if (req.params.resultsId) {

        let singleResult;
        await results.getResultById(req.params.resultsId,{
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
        await students.getStudentById(singleResult[0].studentId,{
            then: rows => {
                studentData = rows;
                //console.log(studentData[0]);
            },
            catch: err => {
                res.status(500).json({ code: 0, err });
                return null;
            }
        })
        singleResult[0].studentUsername=studentData[0].username;

        let studentAnswersData;
        await studentAnswers.getStudentAnswersByResultsId(singleResult[0].id,{
            then: rows => {
                studentAnswersData = rows;
                //console.log(studentAnswersData);
            },
            catch: err => {
                res.status(500).json({ code: 0, err });
                return null;
            }
        })

        let questionList=[];
        studentAnswersData.forEach(e => {
            questionList.push(e.questionId);
        });
        let answerOptionsArray;
        await answerOptions.getAnswerOptionsByQuestionsList(questionList, {
            then: result => {
                answerOptionsArray = result;
                //console.log(result)
            },
            catch: err => {
                res.status(500).json({ code: 0, err });
            }
        })
            .catch(err => res.status(500).json({ code: 0, err }))

        for (let i=0; i< studentAnswersData.length;i++) {
            for (let k =0; k<answerOptionsArray.length;k++) {
                if (studentAnswersData[i].questionId==answerOptionsArray[k].questionId) {
                    if (studentAnswersData[i].studentAnswer==answerOptionsArray[k].answerNo) {
                        studentAnswersData[i].studentAnswerContent=answerOptionsArray[k].answer;
                    }
                    if (studentAnswersData[i].correctAnswer==answerOptionsArray[k].answerNo) {
                        studentAnswersData[i].correctAnswerContent=answerOptionsArray[k].answer;
                    }
                }
            }
        }

        singleResult[0].studentAnswers=studentAnswersData;

        res.status(200).json({ code: 1, results: singleResult });
    }

    
})

router.get("/questionCategories", verifyTeacherRole, async (req,res)=>{
    questions.getUniqueCategories({
        then: rows => {
            res.status(202).json({ code: 1, rows });
        },
        catch: err => {
            res.status(500).json({ code: 0, err });
        }
    })
})

module.exports = router;