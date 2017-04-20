var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequelize;

if (env === 'production') {//Only is production when it's deployed to Heroku
	sequelize = new Sequelize(process.env.DATABASE_URL, {
		'dialect': 'postgres',
		'storage': __dirname + '/data/dev-todo-api.sqlite'
	});
} else {
	sequelize = new Sequelize(undefined, undefined, undefined, {
		'dialect': 'sqlite',
		'storage': __dirname + '/data/dev-todo-api.sqlite'
	});
}


var db = {};

db.todo = sequelize.import(__dirname + '/modules/todo.js');
db.user = sequelize.import(__dirname + '/modules/user.js');
db.token = sequelize.import(__dirname + '/modules/token.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;
//Associations
db.todo.belongsTo(db.user);
db.user.hasMany(db.todo);


module.exports = db;