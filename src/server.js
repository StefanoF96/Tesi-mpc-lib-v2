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

var jiffServer = jiff.make_jiff(server, { logs:true });



