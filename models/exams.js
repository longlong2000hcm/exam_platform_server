const knex = require("../db/knexConfiguration");

const questions = {
    get: async function (callback) {
        return knex
            .from("exams")
            .select("*")
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },
    create: async function (data, callback) {
        return knex("exams")
            .insert([{
                teacherId: data.teacherId,
                name: data.name,
                questionsList: data.questionsList.toString(),
                target: data.target
            }])
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
                console.log(err);
            });

    },
}

module.exports = questions;