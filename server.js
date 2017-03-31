var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;
var _ = require('underscore');
var db = require('./db.js')

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('TODO API Route');
})

//GET /todos
app.get('/todos', function(req, res) {
	var queryParams = req.query;
	var filteredTodos = todos;

	var properties = _.pick(queryParams, 'completed', 'description');
	if (properties.hasOwnProperty('completed') && properties.completed === 'true') {
		filteredTodos = _.where(filteredTodos, {
			completed: true
		})
	} else if (properties.hasOwnProperty('completed') && properties.completed === 'false') {
		filteredTodos = _.where(filteredTodos, {
			completed: false
		})
	}

	if (properties.hasOwnProperty('description') && _.isString(properties.description) && properties.description.trim().length > 0) {
		filteredTodos = _.filter(filteredTodos, function(todo) {
			return todo.description.indexOf(properties.description) !== -1;
		})
	}

	//if has property && completed === 'true'
	//filteredTodos = _.where(filteredTodos, ?)
	//else if has prop && completed === false)

	res.json(filteredTodos);
});

//GET /todos/:id
app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findOne({
		where:{
			id:todoId
		}
	}).then(function(todo){
		if(!!todo)
			res.json(todo.toJSON());
		else
			res.status(404).json('The todo with id '+ todoId+ ' could not be found');
	}, function(e){
		res.status(500).json(e);
	})
	/*var foundTodo = _.findWhere(todos, {
		id: todoId
	});

	if (foundTodo)
		res.json(foundTodo);
	else
		res.status(404).send();*/

});

app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo){
		res.json(todo.toJSON());
	}).catch(function(e){
		res.status(400).json(e);
	});
/*
	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
		return res.status(400).send();
	}

	body.description = body.description.trim();

	body.id = todoNextId++;

	todos.push(body);

	res.json(todos);*/
})

app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var foundTodo = _.findWhere(todos, {
		id: todoId
	});

	if (foundTodo) {
		todos = _.without(todos, foundTodo);
		res.json(foundTodo);
	} else
		res.status(404).json({
			"error": "no todo found for the provided id"
		});
})



app.put('/todos/:id', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		return res.status(400).send('completed must be a boolean');
	}

	if ((body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0)) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		return res.status(400).send('description must be a string');
	}

	var todoId = parseInt(req.params.id, 10);
	var foundTodo = _.findWhere(todos, {
		id: todoId
	});

	if (foundTodo) {
		var newTodo = _.extend(foundTodo, validAttributes); //Passed by reference

		res.json(foundTodo);
	} else
		res.status(404).json({
			"error": "no todo found for the provided id"
		});

})



db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT);
	});
});