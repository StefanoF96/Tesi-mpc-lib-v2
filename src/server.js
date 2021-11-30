<<<<<<< HEAD
module.exports = function () {
	
	const util = require("util");
	
  this.mpcCreate = (implementation_id, debug=true, port=0) => {
			
		switch(implementation_id){
		
		case "jiff":
			if (port == 0)
				port = 9000;
			var server = require('http').Server();
			
			server.listen(port, function() {
				if (debug)
					console.log('listening on *:'+port);
			});

			var JIFFServer = require('../lib/jiff');
			var jiffServer = new JIFFServer(server, { logs:debug, sodium:(!debug) });
			
			break;
			
			case "jigg":
			if (port == 0)
				port = 9001;
			var server = require('http').Server();
			//to prevent server from crashing due to an errate party role
			process.on('uncaughtException', function(err) {
				console.log('Caught exception: ' + err);
				//console.log(util.inspect(jiggServer));
				//console.log(jiggServer.io);
				jiggServer = null;
				jiggServer = new JIGGServer.Server(server, {debug:debug});
			});	
			
			
			server.listen(port, function() {
				if (debug)
					console.log('listening on *:'+port);
			});
			
			
			const JIGGServer = require('../node_modules/jigg/src/jigg.js');
			var jiggServer = new JIGGServer.Server(server, {debug:debug});
			console.log(util.inspect(jiggServer));
			
			//try to prevent conncting another Garbler e/o evaluator
			jiggServer.io.on('connection', function (socket) {
				if(jiggServer.parties.Garbler == null){
					//socket.on('join', jiggServer.join.bind(jiggServer, socket));
					//socket.on('send', jiggServer.send.bind(jiggServer, socket));
					console.log('Garbler not yet connected');
				}
				else{
					console.log('another Garbler tried to connect');
				}
			});
			
			
			break;
=======
var express = require('express');
var app = express();
var server = require('http').Server(app);
var jiff = require('jiff-mpc');

app.use('/app', express.static('./static/', {
    extensions: ['html', 'htm']
		}));
app.use('/lib', express.static('./lib'));
app.use('/dist', express.static('./dist'));
//app.use('/app', express.static('./static/'));

server.listen(9000, function() {
  console.log('listening on http://localhost:9000/app/client');
});
>>>>>>> parent of 59ef8ed... reworked jiff implementation, with github module, instad of the npm one

var jiffServer = jiff.make_jiff(server, { logs:true });



