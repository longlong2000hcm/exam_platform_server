const knex = require("../db/knexConfiguration");
const bcrypt = require("bcrypt");
const saltRounds = 4;
const jwt = require("jsonwebtoken");
const jwtKey = "student";

const generateAuthToken = (id, user) => {
  const token = jwt.sign(
    {
      id,
      ...user
    },
    jwtKey,
    { expiresIn: "7d" }
  );
  return token;
}

const students = {
  get: async function (callback) {
    return knex
      .from("students")
      .select("*")
      .then(data => {
        callback.then(data);
      })
      .catch(err => {
        callback.catch(err);
      });
  },
  getStudentById: async (id, callback) => {
    return knex
      .from("students")
      .select("*")
      .where("id", id)
      .then(data => {
        callback.then(data);
      })
      .catch(err => {
        callback.catch(err);
      });
  },
  create: function (student, callback) {
    bcrypt.hash(student.password, saltRounds).then(hash => {
      return knex("students")
        .insert([{ username: student.username, password: hash }])
        .then(data => {
          callback.then(data);
        })
        .catch(err => {
          callback.catch(err);
          console.log(err);
        });
    });
  },
  login: async function (user, callback) {
    let userData = await knex
      .from("students")
      .select()
      .where("username", user.username);
    userData = userData[0];
    if (userData == null) {
      return { code: 0 };
    }
    const correctPasswordSwitch = await bcrypt.compare(
      user.password,
      userData.password
    );
    console.log(correctPasswordSwitch);
    if (correctPasswordSwitch) {
      return {
        user: userData,
        code: 1,
        token: generateAuthToken(userData.id, userData)
      };
    } else {
      return {
        code: 0
      };
    }
  },

  assignExam: async (target, examId, callback) => {
    console.log("assignExam(target: ", target, ", examId: ", examId, ")");
    let studentList = await knex
      .from("students")
      .select("*")
      .then(data => data)
      .catch(err => callback(err));
    if (typeof (target) == "string" && target.toLowerCase() == "all") {
      for (let i = 0; i < studentList.length; i++) {
        let pendingExams = studentList[i].pendingExams.split(",");
        pendingExams.splice(pendingExams.indexOf(""), 1);
        if (!pendingExams.find(id => id == examId)) {
          pendingExams.push(examId);
          await knex("students")
            .where("id", studentList[i].id)
            .update({
              pendingExams: pendingExams.toString()
            })
            .then(data => data)
            .catch(err => callback.catch(err));
        }
      }
      callback.then("Finished assigning exam " + examId + " to all students.");
    }
    else if (typeof (target) == "number") {
      let pendingExams = studentList[target].pendingExams.split(",");
      pendingExams.splice(pendingExams.indexOf(""), 1);
      if (!pendingExams.find(id => id == examId)) {
        pendingExams.push(examId);
        await knex("students")
          .where("id", studentList[target].id)
          .update({
            pendingExams: pendingExams.toString()
          })
          .then(data => data)
          .catch(err => callback.catch(err));
      }
      callback.then("Finished assigning exam " + examId + " to student " + target + ".");
    }
    else {
      callback.then('Target can only be "all" or a studentId.')
    }
  },

  removeExam: async (studentId, examId, callback) => {
    let pendingExams = await knex
    .from("students")
    .select("pendingExams")
    .where("id", studentId);
    console.log(pendingExams);
    pendingExams=pendingExams[0].pendingExams.split(",");
    pendingExams.splice(pendingExams.findIndex(e=>e==examId),1);
    pendingExams=pendingExams.toString();
    return knex("students")
      .where("id", studentId)
      .update({
        pendingExams: pendingExams
      })
      .then(data => {
        callback.then(data);
      })
      .catch(err => {
        callback.catch(err);
      });
  }
}

module.exports = students;