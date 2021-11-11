/*
setTimeout(function () {
  var icon = document.getElementById('frame1').getElementsByClassName('fa-play')[0];
  icon.parentNode.removeChild(icon);
}, 2000);
*/
var test1;
var test2;
var test3;
var options;
var jiffClient;
var notify_counter = 0

function onConnect(){
	
}


function connect(callback) {	
		$('#connectButton').prop('disabled', true);

    var options = { party_count: 3}; //metto statico il numero di party a 3 per ora...
		
		//what to do after an error occoured
    options.onError = function (_, error) {
      $('#output').append("<p class='error'>"+error+'</p>');
			$('#output').scrollTop($('#output').children().length*30)
			$('#connectButton').prop('disabled', false);
    };
		//what to do after connection
    options.onConnect = function () {
      $('#button').attr('disabled', false); 
			//$('#output').append('<p>All parties Connected!</p>');
			//$('#output').scrollTop($('#output').children().length*30)
			console.log('All parties connected!');
    };
		options.crypto_provider = true;
		
		options2 = options
		
		//setting up hostname
    var hostname = window.location.hostname.trim();
    var port = 9000;
    if (port == null || port === '') {
      port = '80';
    }
		//generic controlls on hostname 
    if (!(hostname.startsWith('http://') || hostname.startsWith('https://'))) {
      hostname = 'http://' + hostname;
    }
    if (hostname.endsWith('/')) {
      hostname = hostname.substring(0, hostname.length-1);
    }
    if (hostname.indexOf(':') > -1 && hostname.lastIndexOf(':') > hostname.indexOf(':')) {
      hostname = hostname.substring(0, hostname.lastIndexOf(':'));
    }

    hostname = hostname + ':' + port;
		
		//connection to mpc server
		//jiffClient = new JIFFClient(hostname, 'sum_computation', options);
		//jiffClient_2 = new JIFFClient(hostname, 'product_computation', options);		
		jiffClient = jiff.make_jiff(hostname, 'sum_computation', options);
		jiffClient_2 = jiff.make_jiff(hostname, 'product_computation', options2);
		
		//if(callback != null)
			//callback();
		
}

function notify(){
	if(jiffClient.isInitialized()){
		//console.log('aaaaaaa');
		jiffClient.emit('new_party', null, message=$('#username').val(), false);
		jiffClient.listen('new_party', function(sender_id,message){console.log(message+' from '+sender_id)});
		$('#output').append('<p>Welcome '+$('#username').val()+'</p>');	
		}
	else{
		setTimeout(function(){
			console.log('timeout');
			notify_counter++;
			if(notify_counter<=50)
				notify();
		},50);
	}
}

function connect_and_notify(){
	notify_counter = 0
	connect(notify);
}


function EnableDisable(txtPassportNumber, buttonId) {
        //Reference the Button.
        var btnSubmit = document.getElementById(buttonId);
 
        //Verify the TextBox value.
        if (txtPassportNumber.value.trim() != "") {
            //Enable the TextBox when TextBox has value.
            btnSubmit.disabled = false;
        } else {
            //Disable the TextBox when TextBox is empty.
            btnSubmit.disabled = true;
        }
    };
		
//here is the Jiff operations to compute sum of the shares
function compute_sum(id){
	var input = parseInt($('#'+id+'').val());

		try{
			var shares = jiffClient.share(input);
			test1 = shares;
			var pre_result = shares[1].add(shares[2]).add(shares[3]);
			test2 = pre_result;
			var result = jiffClient.open(pre_result);
			test3 = result;
			result.then(function (results) {
				console.log('options', options);
				console.log('sum results', results);
				$('#output').append("<p class='results'>sum result: "+results+'</p>');
				$('#output').scrollTop($('#output').children().length*30)
			});
			$('#output').append("<p>Input shared</p>");
			$('#output').scrollTop($('#output').children().length*30)
		}
		catch(error){
			$('#output').append("<p class='error'>An error occoured</p>");
			$('#output').append("<p class='error'>"+error+"</p>");
		}
	
}

function compute_multiplication(id){
	var input = parseInt($('#'+id+'').val());

		try{
			var shares = jiffClient_2.share(input);
			var pre_result = shares[1].mult(shares[2]).mult(shares[3]);
			var result = jiffClient_2.open(pre_result);
			result.then(function (results) {
				console.log('options', options);
				console.log('product results', results);
				$('#output').append("<p class='results'>product result: "+results+'</p>');
				$('#output').scrollTop($('#output').children().length*30)
			});
			$('#output').append("<p>Input shared</p>");
			$('#output').scrollTop($('#output').children().length*30)
		}
		catch(error){
			$('#output').append("<p class='error'>An error occoured</p>");
			$('#output').append("<p class='error'>"+error+"</p>");
		}
	
	
}