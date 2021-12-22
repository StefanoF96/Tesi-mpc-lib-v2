
var times_test = null;

function start_tests(){
	times_test = simple_mpc.init_simple_mpc('localhost',2, "jiff_times_test!!!", "jiff");
	times_test.connect();
	times_test.jiffClient.Zp = 2712838789;
									//deafult (25 bits): 16777729 
									//32 bits : 2712838789
									//48 bits : 224044004191897
}
//use two parties to run this tests...

function jiff_test_sum(n){
	var deferred = $.Deferred();
	
	start_time = performance.now()
	console.log("start sum test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].add(shares[2]);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("sum test end, total time: " + tot_comp_time + "s");
		console.log(res);
		deferred.resolve();
	});
	
	return deferred.promise(); 
}

function jiff_test_mult(n){
	var deferred = $.Deferred();
	
	start_time = performance.now()
	console.log("start multiplication test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].mult(shares[2]);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("multiplication test end, total time: " + tot_comp_time + "s");
		console.log(res);
		deferred.resolve();
	});
	
	return deferred.promise(); 
}

function jiff_test_greater(n){
	var deferred = $.Deferred();
	
	start_time = performance.now()
	console.log("greater-equal  test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].gteq(shares[2]);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("greater-equal test end, total time: " + tot_comp_time + "s");
		console.log(res);
		deferred.resolve();
	});
	
	return deferred.promise(); 
}

function jiff_test_greater_costant(n){
	var deferred = $.Deferred();
	
	start_time = performance.now()
	console.log("greater-equal-costant  test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].cgteq(100);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("greater-equal-costant test end, total time: " + tot_comp_time + "s");
		console.log(res);
		deferred.resolve();
	});
	
	return deferred.promise(); 
}

function jiff_test_equality(n){
	var deferred = $.Deferred();
	
	start_time = performance.now()
	console.log("equality test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].eq(shares[2]);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("equality test end, total time: " + tot_comp_time + "s");
		console.log(res);
		deferred.resolve();
	});
	
	return deferred.promise(); 
}

function jiff_test_division(n){
	var deferred = $.Deferred();
	
	start_time = performance.now()
	console.log("division test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].div(shares[2]);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("division test end, total time: " + tot_comp_time + "s");
		console.log(res);
		deferred.resolve();
	});
	
	return deferred.promise(); 
}

function jiff_test_division_costant(n){
	var deferred = $.Deferred();
	
	start_time = performance.now()
	console.log("division-costant test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].cdiv(2);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("division-costant test end, total time: " + tot_comp_time + "s");
		console.log(res);
		deferred.resolve();
	});
	
	return deferred.promise(); 
}

//test with arrays
//TODO
/*
function jiff_test_sum(arr){
	start_time = performance.now()
	console.log("start sum test");
	shares = times_test.jiffClient.share_array(arr)
	pre_result = shares[1].add(shares[2]);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("sum test end, total time: " + tot_comp_time + "s");
		console.log(res);
	});
}

function jiff_test_mult(n){
	start_time = performance.now()
	console.log("start multiplication test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].mult(shares[2]);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("multiplication test end, total time: " + tot_comp_time + "s");
		console.log(res);
	});
}

function jiff_test_greater(n){
	start_time = performance.now()
	console.log("greater-equal  test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].gteq(shares[2]);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("greater-equal test end, total time: " + tot_comp_time + "s");
		console.log(res);
	});
}

function jiff_test_greater_costant(n){
	start_time = performance.now()
	console.log("greater-equal-costant  test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].cgteq(100);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("greater-equal-costant test end, total time: " + tot_comp_time + "s");
		console.log(res);
	});
}

function jiff_test_equality(n){
	start_time = performance.now()
	console.log("equality test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].eq(shares[2]);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("equality test end, total time: " + tot_comp_time + "s");
		console.log(res);
	});
}

function jiff_test_division(n){
	start_time = performance.now()
	console.log("division test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].div(shares[2]);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("division test end, total time: " + tot_comp_time + "s");
		console.log(res);
	});
}

function jiff_test_division_costant(n){
	start_time = performance.now()
	console.log("division-costant test");
	shares = times_test.jiffClient.share(n)
	pre_result = shares[1].cdiv(2);
	result = times_test.jiffClient.open(pre_result);
	result.then(function(res){
		end_time = performance.now()
		tot_comp_time = (end_time-start_time)/1000;
		console.log("division-costant test end, total time: " + tot_comp_time + "s");
		console.log(res);
	});
}
*/

function test_all(n){
	
	jiff_test_sum(n).then(function(){
		jiff_test_mult(n).then(function(){
			jiff_test_greater(n).then(function(){
				jiff_test_greater_costant(n).then(function(){
					jiff_test_equality(n).then(function(){
						jiff_test_division(n).then(function(){
							jiff_test_division_costant(n);
						});
					});
				});
			});		
		});
	});

}