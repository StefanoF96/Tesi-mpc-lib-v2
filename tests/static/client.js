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
	jiff_test = simple_mpc.init_simple_mpc('localhost',$('#num_parties').val(), $('#comp_id').val(), $('#implems').val());
	if($('#implems').val() == 'jigg')
		jiff_test.jigg_role = $('#comp_id').val();
	$('#button1').prop('disabled', false);
	$('#button2').prop('disabled', false);
	
	//if(callback != null)
		//callback();
}

function computeEquality(){
	
	result = jiff_test.compute_equality(parseInt($('#number1').val()));
	result.then(function(res){
		if(res == 1)
			console.log("all the elements given in input from parties are equal!");
		else if(res == 0)
			console.log("the elements given in input from parties aren't equal.");
		else
			console.log("some error occoured in the computation");		
	});
		
}

function computeSorting(){
	
	input_arr = $('#array1').val().replace(/\s/g, '').replace('[','').split(',')
	input_arr.forEach(function(elm, index){
		input_arr[index] = parseInt(elm);
	});
	result = jiff_test.compute_sorting(input_arr);
	result.then(function(res){
		console.log('the array of all parties inputs is the followning: ');
		console.log(res);
	});
		
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
		


