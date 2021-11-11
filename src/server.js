
module.exports = function () {
	
  this.mpcCreate = (implementation_id, debug=true, port=9000) => {
		
		switch(implementation_id){
		
		case "jiff":
			var server = require('http').Server();
			
			server.listen(port, function() {
				if (debug)
					console.log('listening on *:'+port);
			});

			var JIFFServer = require('../lib/jiff');
			var jiffServer = new JIFFServer(server, { logs:debug });
			
			break;

		default:
			return false;
		}
	}
	

}


/*

module.exports = function () {
	this.name = 'GeeksforGeeks';
	this.website = 'https://geeksforgeeks.org';
	this.info = () => {
		console.log(`Company name - ${this.name}`);
		console.log(`Website - ${this.website}`);
	}
}

*/