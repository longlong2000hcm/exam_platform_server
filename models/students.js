const knex = require("../db/knexConfiguration");
const bcrypt = require("bcrypt");
const saltRounds = 4;
const jwt = require("jsonwebtoken");
const jwtKey = "student";

const generateAuthToken = (id,  user) => {
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
    login: async function(user, callback) {
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
}

module.exports = students;