const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const NodeCouchDb = require('node-couchdb');

const app = express();
const port = process.env.PORT || 3000

// node-couchdb instance with default options
const couch = new NodeCouchDb({
	auth: {
		user: process.env.couchUser,
		pass: process.env.couchPass
	}
});

const dbName = "customers";
const viewUrl = "_design/all_customers/_view/all";

// view engine middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// simple route
app.get('/', function(req, res){
	couch.get(dbName, viewUrl).then(({data, headers, status}) => {
    // data is json response
    // headers is an object with all response headers
		// status is statusCode number
		console.log('### data:', data.rows)
		res.render('index', {
			customers: data.rows
		});
	}, err => {
			// either request error occured
			// ...or err.code=EDOCMISSING if document is missing
			// ...or err.code=EUNKNOWN if statusCode is unexpected
			res.send(err);
	});
})

app.post('/customer/add', function(req, res){
	const name = req.body.name;
	const email = req.body.email;
	const phone = req.body.phone;
	
	couch.uniqid().then(ids => {
		couch.insert(dbName, {
			_id: ids[0],
			// field: [name, email, phone]
			name: name,
			email: email,
			phone: phone
		}).then(({data, headers, status}) => {
				// data is json response
				// headers is an object with all response headers
				// status is statusCode number
				console.log('#### submit:',data)
				res.redirect('/');
		}, err => {
				// either request error occured
				// ...or err.code=EDOCCONFLICT if document with the same id already exists
		});
	});
})

app.post('/customer/delete/:id', function(req, res){
	const id = req.params.id;
	const rev = req.body.rev
	console.log(id)
	couch.del(dbName, id, rev).then(({data, headers, status}) => {
    // data is json response
    // headers is an object with all response headers
		// status is statusCode number
		console.log('#### del:',data)
		res.redirect('/')
}, err => {
    // either request error occured
    // ...or err.code=EDOCMISSING if document does not exist
		// ...or err.code=EUNKNOWN if response status code is unexpected
		res.send(err)
});
})

// server
app.listen(port, function(){
	console.log('server running on port', port);
});

couch.listDatabases().then(dbs => console.log("##### hey", dbs), err => {
	// request error occured
	console.log(err)
});



