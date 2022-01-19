var path = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);
const fs = require('fs')
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false});

fs.writeFile('./testfile', 'aaaaaaaaaaaaaaa\n', {flag : 'a'}, err => {
			if (err) {
				console.error(err)
				return
			}
			//file written successfully
		})


// Serve static files.
app.use('/app', express.static('./static/', {
    extensions: ['html', 'htm']
		}));
app.use('/lib', express.static('../lib'));
app.use('/src', express.static('../src'));
app.use('/jigg_libs', express.static('../node_modules/jigg/dist'));
app.use('/jigg_circuits', express.static('../circuits'));


//for testing purpose: saving files with times
app.post('/post_time', urlencodedParser, function(req, res) {

    var implementation = req.body.implem;
    var operation = req.body.op;
    var time = req.body.time;
		console.log("DEBUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG");
		console.log(implementation);
		console.log(operation);
		console.log(time);
		
		fs.writeFile('./tests/times_'+implementation+'_'+operation+'.txt', time+'\n', {flag : 'a'}, err => {
			if (err) {
				console.error(err)
				return
			}
			//file written successfully
		})
		
		
    res.end('submitted');
});



http.listen(8080, function () {
  console.log('listening on *:8080');
});

console.log('Direct your browser to http://localhost:8080/app/client');

//start my library mpc server
const Mpc = require('../src/server');
const mpc_istance = new Mpc();
mpc_istance.mpcCreate("jiff", true, port=9000);
mpc_istance.mpcCreate("jigg", true, port=9001);