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

var continue_testing = false;


//test_sorting and test intersection call each other in alterante way
//test is done selecting manually in the code jiff_intesection_1 (PSI using PairwiseComparisons)
function test_intersection(elm_num){
	array = ''+Math.floor(Math.random() * 9999);
	for (i=1; i<elm_num; i++){
		random = Math.floor(Math.random() * 9999);
		array += ','+random;
	}
	$('#array2').val(array);
	start_time = performance.now();
	computeSetIntersection().then(function(res){
		console.log(res);
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("intesection test time: " + tot_comp_time + "s");
		//send data to file
			$.post("../post_time",
							{
								implem: "JIFF",
								op: "PairwiseComparisonsIntersection_test_("+elm_num+"+"+elm_num+" vals)",
								time: tot_comp_time
							},
							function(data, status){
								console.log("Data: " + data + "\nStatus: " + status);
							}
			);
			if (continue_testing)
				test_sorting(elm_num+1);
	});
	
}


//test_sorting and test intersection call each other in alterante way
function test_sorting(elm_num){
	array = ''+Math.floor(Math.random() * 9999);
	for (i=1; i<elm_num; i++){
		random = Math.floor(Math.random() * 9999);
		array += ','+random;
	}
	$('#array1').val(array);
	start_time = performance.now();
	computeSorting().then(function(res){
		console.log(res);
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("sorting test time: " + tot_comp_time + "s");
		//send data to file
			$.post("../post_time",
							{
								implem: "JIFF",
								op: "sorting(no_in_len_hide)_test_("+elm_num+"+"+elm_num+" vals)",
								time: tot_comp_time
							},
							function(data, status){
								console.log("Data: " + data + "\nStatus: " + status);
							}
			);
			if (continue_testing)
				test_intersection(elm_num);
	});
	
}

function runSomeJIFFTests(){
	if (continue_testing)
		continue_testing = false;
	else{
		continue_testing = true;		
	
		test = simple_mpc.init_simple_mpc('localhost',2, "testttt004700",'jiff');
		$('#connectButton').prop('disabled', true);
		
		//test jiff equality
		$('#number1').val(Math.floor(Math.random() * 9999));
		start_time = performance.now();
		computeEquality().then(function(res){
			console.log(res);
			end_time = performance.now()
			tot_comp_time = (end_time-start_time)/1000;
			console.log("equality test time: " + tot_comp_time + "s");
			//send data to file
			$.post("../post_time",
							{
								implem: "JIFF",
								op: "equality_test",
								time: tot_comp_time
							},
							function(data, status){
								console.log("Data: " + data + "\nStatus: " + status);
							}
			);
			if (continue_testing)
				test_sorting(1);
			
		});
	}
		
}



function connect(callback) {	

	$('#connectButton').prop('disabled', true);
	test = simple_mpc.init_simple_mpc('localhost',$('#num_parties').val(), $('#comp_id').val(), $('#implems').val());
	if($('#implems').val() == 'jigg')
		test.jigg_role = $('#comp_id').val();
	$('#button1').prop('disabled', false);
	$('#button2').prop('disabled', false);
	$('#button3').prop('disabled', false);

	//if(callback != null)
		//callback();
}

function computeEquality(){
	start_time = performance.now();
	result = test.compute_equality(parseInt($('#number1').val()));
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("equality test time: " + tot_comp_time + "s");
		if(res == 1)
			console.log("all the elements given in input from parties are equal!");
		else if(res == 0)
			console.log("the elements given in input from parties aren't equal.");
		else
			console.log("some error occoured in the computation");				
	});
	return result;
}

function computeSorting(){
	start_time = performance.now();
	input_arr = $('#array1').val().replace(/\s/g, '').replace('[','').split(',')
	input_arr.forEach(function(elm, index){
		input_arr[index] = parseInt(elm);
	});
	result = test.compute_sorting(input_arr);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("sorting test time: " + tot_comp_time + "s");
		console.log('the array of all parties inputs is the followning: ');
		console.log(res);
	});
	return result;
}

function computeSetIntersection(){
	start_time = performance.now();
	input_arr = $('#array2').val().replace(/\s/g, '').replace('[','').split(',')
	input_arr.forEach(function(elm, index){
		input_arr[index] = parseInt(elm);
	});
	result = test.compute_intersection(input_arr);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("intersection test time: " + tot_comp_time + "s");
		console.log('the array of all parties inputs is the followning: ');
		console.log('the element in the intersection are: ');
		console.log(res);
	});
	return result;
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
		


