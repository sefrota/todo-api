var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;
var _ = require('underscore');
var db = require('./db.js')
var bcrypt = require('bcrypt');
var middleware = require('./middleware')(db);

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('TODO API Route');
})

//GET /todos
app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var query = req.query;
	var where = {};

	where.userId = req.user.get('id');

	if (query.hasOwnProperty('completed') && query.completed === 'true') {
		where.completed = true;
	} else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;
	}

	if (query.hasOwnProperty('description') && query.description.length > 0) {
		where.description = {
			$like: '%' + query.description + '%'
		}
	}

	db.todo.findAll({
		where: where
	}).then(function(todos) {
		res.json(todos);
	}, function(e) {
		res.status(500).json(e);
	})

});

//GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findOne({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then(function(todo) {
		if (!!todo)
			res.json(todo.toJSON());
		else
			res.status(404).json('The todo with id ' + todoId + ' could not be found');
	}, function(e) {
		res.status(500).json(e);
	})


});

app.post('/todos', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		//res.json(todo.toJSON());
		req.user.addTodo(todo).then(function(){
			return todo.reload(); // we reload the todo to persist the changes to todo object we have in the db
		}).then(function(todo){
			res.json(todo.toJSON());
		});
	}).catch(function(e) {
		res.status(400).json(e);
	});

})

app.post('/users', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
	}).catch(function(e) {
		res.status(400).json(e);
	});

})

app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoId,
			userId:req.user.get('id')
		}
	}).then(function(rowsDel) {
		if (rowsDel > 0) {
			res.status(204).send();
		} else {
			res.status(404).send({
				message: 'No todo was found'
			});
		}
	}, function(e) {
		res.status(500).send();
	});

})



app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};
	var todoId = parseInt(req.params.id, 10);

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findOne({
		where:{
			id:todoId,
			userId:req.user.get('id')
		}}).then(function(todo) {
		if (todo) {
			todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	})

})


// POST /users/login
app.post('/users/login', function(req, res){
	var body = _.pick(req.body, 'email', 'password');
	var userInstance;
	db.user.authenticate(body).then(function(user){
		var token = user.generateToken('authentication');
		userInstance = user;
		return db.token.create({
			token:token
		});
	}).then(function(tokenInstance){
		res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
	}).catch(function(){
		res.status(401).send();//Authentication is possible but failed - 401 - Unauthorized
	});
});

//DELETE /users/login
app.delete('/users/login', middleware.requireAuthentication, function(req, res){
	req.token.destroy().then(function(){
		res.status(204).send();
	}).catch(function(){
		res.status(500).send();
	})
});

db.sequelize.sync({force:true}).then(function() {
	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT);
	});
});