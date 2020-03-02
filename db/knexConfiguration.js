var knex = require('knex')({
    client: 'mysql2',
    connection: {
      // host : 'localhost',
      // user : 'root',
      // password : 'root',
      // database : 'exam_platform'
      host : '35.228.126.82',
      user : 'root',
      password : 'root',
      database : 'exam_platform',
      // port: 3306
    }
  });

module.exports = knex;