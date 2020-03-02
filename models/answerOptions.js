const knex = require("../db/knexConfiguration");

const answerOptions = {
    get: async function (callback) {
        return knex
            .from("answeroptions")
            .select("*")
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },

    getAnswerOptionsByQuestionsList: async (questionsArray, callback) => {
        return knex
            .from("answeroptions")
            .select("*")
            .whereIn('questionId', questionsArray)
            .then(data => {
                callback.then(data);
            })
            .catch(err => {
                callback.catch(err);
            });
    },

    create: async (data,questionId, callback) => {
        let result = [];
        for (let i = 0; i < data.length; i++) {
            await knex("answeroptions")
                .insert([{
                    questionId: questionId,
                    answerNo: data[i].answerNo,
                    answer: data[i].answer,
                }])
                .then(data => {
                    result.push(...data);
                })
                .catch(err => {
                    console.log(err);
                });
        }
        callback.then(result);
    },
}

module.exports = answerOptions;