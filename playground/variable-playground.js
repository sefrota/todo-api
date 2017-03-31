/*var person = {
	name:'Sergio',
	age:26
};

function updatePerson(obj){
	obj = {
		name:'Sergio',
		age:29
	};
	obj.age=29;
}

updatePerson(person);
console.log(person)*/

//array example

var numbers =[2, 3, 4];

function changeArray(array){
	//array = [3,5,6];
	array[0] = 3;
	array[1] = 5;
	array[2] = 6;
	debugger;
}

changeArray(numbers);
console.log(numbers);