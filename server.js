var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res){
	res.send('TODO API Route');
})

//GET /todos
app.get('/todos', function(req, res){
	res.json(todos);
});

//GET /todos/:id
app.get('/todos/:id', function(req, res){
	var todoId = parseInt(req.params.id, 10);
	var foundTodo;
	todos.forEach(function(todo){
		if(todo.id === todoId){
			foundTodo = todo;
			return;
		}
	});
	if(foundTodo)
		res.json(foundTodo);
	else
		res.status(404).send();

});

app.post('/todos', function(req, res){
	var body = req.body;
	var newTodo = {
		id:todoNextId++,
		description: body.description,
		completed:body.completed
	};

	todos.push(newTodo);

	res.json(todos);
})

app.listen(PORT, function(){
	console.log('Express listening on port ' + PORT);
});

