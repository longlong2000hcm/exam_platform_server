const knex = require("../db/knexConfiguration");

const results = {
    get: async function (callback) {
        return knex
            .from("results")
            .select("*")
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },

    getResultById: async (resultId, callback) => {
        return knex
            .from("results")
            .select("*")
            .where("id", resultId)
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },

    getResultByStudentId: async (studentId, callback) => {
        return knex
            .from("results")
            .select("*")
            .where("studentId", studentId)
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },

    create: async function (data, callback) {
        return knex("results")
            .insert([data])
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
                console.log(err);
            });

    },
}

module.exports = results;