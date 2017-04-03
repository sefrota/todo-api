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
	var query = req.query;
	var where = {};

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
app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findOne({
		where: {
			id: todoId
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

app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		res.json(todo.toJSON());
	}).catch(function(e) {
		res.status(400).json(e);
	});

})

app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function(rowsDel) {
		if (rowsDel > 0){
			res.status(204).send();
		}else{
			res.status(404).send({message:'No todo was found'});
		}
	}, function(e) {
		res.status(500).send();
	});



	/*var foundTodo = _.findWhere(todos, {
		id: todoId
	});

	if (foundTodo) {
		todos = _.without(todos, foundTodo);
		res.json(foundTodo);
	} else
		res.status(404).json({
			"error": "no todo found for the provided id"
		});*/
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