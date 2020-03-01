const knex = require("../db/knexConfiguration");

const questions = {
    get: async function (callback) {
        return knex
            .from("questions")
            .select("*")
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },
    getQuestionsByQuestionsList: async (questionsArray, callback) => {
        return knex
            .from("questions")
            .select("*")
            .whereIn('id', questionsArray)
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },

    getQuestionsByCategory: async (category, callback) => {
        return knex
            .from("questions")
            .select("*")
            .where('category', category)
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },

    getUniqueCategories: async (callback) => {
        return knex
            .distinct()
            .from("questions")
            .pluck("category")
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },

    create: async function (data, callback) {
        return knex("questions")
            .insert([{
                category: data.category.toLowerCase(),
                question: data.question,
                correctAnswerNo: data.correctAnswerNo,
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