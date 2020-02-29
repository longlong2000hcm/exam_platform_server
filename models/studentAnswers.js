const knex = require("../db/knexConfiguration");

const studentAnswers = {
    get: async function (callback) {
        return knex
            .from("studentAnswers")
            .select("*")
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },
    getStudentAnswersByResultsId: async (resultId, callback) => {
        return knex
            .from("studentAnswers")
            .select("*")
            .where("resultId", resultId)
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },

    create: async function (data, callback) {
        for (let i = 0; i < data.length; i++) {
            await knex("studentAnswers")
            .insert(data[i])
            .then(data => data)
            .catch(err => {
                callback.catch(err);
                console.log(err);
            });
        }
        return("Insert data complete")
    },
}

module.exports = studentAnswers;