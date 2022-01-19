/**
 * The exposed API from simple_mpc.js (client side library).
 * Wraps the simple_mpc API. Internal members can be accessed with simple_mpc.&lt;member-name&gt;.
 * @namespace simple_mpc
 * @version 1.0
 */
(function(exports, node) {
	
	implementations_list = ['jiff','jigg'];
	
	function jiff_equality_comp(mpc_istance, value){
		var shares = mpc_istance.jiffClient.share(value);
		var pre_result = shares[1].eq(shares[2]);
		//if there are more than 2 parties, the computation checks if all inputs are equal
		for (i=3;i<=mpc_istance.jiffClient.party_count;i++){
			pre_result = pre_result.mult(shares[1].eq(shares[i]));
		}
		var result = mpc_istance.jiffClient.open(pre_result);
		
		return result;
	}
	
	//utility ysed to reveal my input array size
	//put in result_sizes_arr, the input sizes of each party
	function revealInputSizes(mpc_istance, size, result_sizes_arr){
		if (result_sizes_arr == null || result_sizes_arr.length == 0){
			for(i=0; i<mpc_istance.party_count; i++)
				result_sizes_arr.push(null);
		}
		mpc_istance.emit("input_size", null,size.toString(),false);
		mpc_istance.listen("input_size", function(id,msg){
				console.log("incoming from " + id + ": " + msg);
				result_sizes_arr[id-1] = parseInt(msg);
		});
		
	}
	
	
	//Funtions for jigg
	function getCircuit(circuit){
		return $.ajax('/jigg_circuits/' + circuit);
	}
	
	//jigg utility
	function dec_to_binlist(dec){
		b_list = (dec >>> 0).toString(2).split('').reverse();
		b_list.forEach(function (item, index) {
					b_list[index] = parseInt(b_list[index]);
				});
		return b_list;
	}	
	
	
	function init_simple_mpc(hostname, party_count, comp_id, implementation='jiff', port=0){
		
		var mpc = {};
		
		mpc.result = null;
		mpc.connected = false;
		
		if (hostname == null)
			throw new Error('hostname not defined')
		if (!implementations_list.includes(implementation))
			throw new Error('implementation "'+ implementation +'" dosn\'t exists');
		if (party_count != 2 && implementation == 'jigg')
			throw new Error('implementation "'+ implementation +'" require exactly two parties');
		
		mpc.hostname = hostname;
		if (port != 0){
			mpc.hostname += ":" + port;
			mpc.port_flag = true;
		}
		else{
			mpc.port_flag = false;
		}
		mpc.implementation = implementation;
		mpc.comp_id = comp_id;
		
		//default options
		mpc.options = { party_count: party_count}; //metto statico il numero di party a 3 per ora...
		//what to do after an error occoured
    mpc.options.onError = function (_, error) {
      throw new Error('error in mpc');
    };
		mpc.options.crypto_provider = true;		
		
		//NO ENCRYPTION, SET TO TRUE FOR DEBUG ONLY!!!
		mpc.options.sodium = false;
		
		/**
     * Connect to the selected server implementation
     * @method connect
     * @memberof simple_mpc.mpc
     * @instance
     * @returns the client implementation of selected library
     */
		mpc.connect = function(){
			//jiff
			if(implementation === 'jiff'){					
				if (mpc.port_flag == false){
					mpc.hostname += ":" + 9000;
					mpc.port_flag = true;
				}
				mpc.jiffClient = new JIFFClient(mpc.hostname, mpc.comp_id, mpc.options);
				mpc.party_id = mpc.jiffClient.id;
				
				//for jiff performance 
				mpc.jiffClient.apply_extension(jiff_performance, { elementId: 'perfDiv', url: "/lib/sound.mp3" });		
				
				mpc.connected = true;
				return mpc.jiffClient;
			}
			//jigg
			if(implementation === 'jigg'){
				if (mpc.jigg_role != "Evaluator" && mpc.jigg_role != "Garbler")
					throw new Error('mpc.jigg_role MUST be defined as Garbler or Evaluator');
				if (mpc.port_flag == false){
					mpc.hostname += ":" + 9001;
					mpc.port_flag = true;
				}
				mpc.jiggClient = new JIGG(mpc.jigg_role, mpc.hostname);
				mpc.party_id = mpc.jiggClient.id;
				
				mpc.connected = true;
				return mpc.jiggClient;
			}			
		}
		
		/**
     * Compute equality for the given simple mpc instance
     * @method compute_equality
     * @memberof simple_mpc.mpc
     * @instance
     * @param {integer} value - the value used as this party input in the equality computation
     * @returns {Ppromise Object} promise - promise to the result of the computation;
		 *					the result is 1 if all elements are equal, 0 otherwise.
     */
		mpc.compute_equality = function(value){
			//jiff equality implementation
			if(implementation === 'jiff'){
				return promise = new Promise(function(resolve, reject) {
					try{
						//NOTE devo aspettare che mpc.connect sia completato prima di poter usare l'oggetto mpc.jiffClient
						//EDIT: in realtà devo aspettare che tutti i client sono connessi se non non posso condividere gli shares
						//Perchè? ... perchè se prima non ho la chiave pubblica degli altri party non posso mandargli i messaggi.
						
						//what to do after connection (i.e implementation of equality operation)
						mpc.options.onConnect = function () {
							//console.log('All parties connected!'); //debug
							mpc.result = jiff_equality_comp(mpc, value);
							resolve(mpc.result);
						};
						
						if (mpc.jiffClient == null)
							//connecting to jiff, when all parties are connected, triggers the callback above.
							//mpc.jiffClient = new JIFFClient(mpc.hostname, mpc.comp_id, mpc.options);
							mpc.connect();
						else //else trigger directly the function to compute equality
						{
							mpc.result = jiff_equality_comp(mpc, value);	
							resolve(mpc.result);
						}
						
					}catch(err){
						reject(err);
					}
				});//end promise
			}//end jiff case
			else if (implementation === 'jigg'){
				return promise = new Promise(function(resolve, reject) {
					try{
						var inputs = dec_to_binlist(value);
						//pad input array with zeros
						var pad = new Array(32).fill(0);
						inputs.push(...pad);
						inputs = inputs.slice(0,32)
						
						const circuit = getCircuit("32bit_equality.txt");
						
						if (mpc.jiggClient == null || mpc.connected == false)
							mpc.connect();
						
						circuit.then(function(circuit){
							mpc.jiggClient.loadCircuit(circuit);
							mpc.jiggClient.setInput(inputs);

							// display progress and output
							mpc.jiggClient.addProgressListener(function (status, currentGate, totalGates, error) {
									console.log(status, currentGate, totalGates, error);
							});
							mpc.result=	mpc.jiggClient.getOutput();
							resolve(mpc.result);
							mpc.jiggClient.getOutput().then(function (outputs) {
								console.log('Output', outputs);
								mpc.jiggClient.disconnect(); // close the connection
								mpc.connected = false;
							});

							// start
							mpc.jiggClient.start();
						});
					}catch(err){
						reject(err);
					}		
				});//end promise
			}//end jigg case
			else
				return 0;
		}
		
		mpc.counter = 0;
		//private functions utility for jiff sorting
		//
		//swap a and b in place, if a is greater than b_list
		//then the lower element is in position a, and the greater of the two is in position b.
		var compareAndExchange = function(a,b){

			if(b>= mpc.sort_arr_conc.length) //if b is not >= arr length, we are out of range
				return;
			else{
				//debug 
				mpc.counter+=1;
				console.log("compare exchange counter: " + mpc.counter);
				console.log("a: " + a + " b: " + b);
				var a_greater = mpc.sort_arr_conc[a].gt(mpc.sort_arr_conc[b]);
				//values
				var greater_val = (a_greater.mult(mpc.sort_arr_conc[a])).add(a_greater.not().mult(mpc.sort_arr_conc[b]));
				var lower_val = (a_greater.mult(mpc.sort_arr_conc[b])).add(a_greater.not().mult(mpc.sort_arr_conc[a]));
				//positions
				var greater = (a_greater.mult(mpc.sort_arr_conc_key[a])).add(a_greater.not().mult(mpc.sort_arr_conc_key[b]));
				var lower = (a_greater.mult(mpc.sort_arr_conc_key[b])).add(a_greater.not().mult(mpc.sort_arr_conc_key[a]));

				mpc.sort_arr_conc[a] = lower_val;
				mpc.sort_arr_conc[b] = greater_val;
				mpc.sort_arr_conc_key[a] = lower;
				mpc.sort_arr_conc_key[b] = greater;
			}
		}
		
			//SORTING NETWORK
			//
			//input: sequence with the two halves sorted (st = start position in array; 
			//			 n = number of elements to sort from st; dist = distance of elements to compare)
			//output: two halves merged and sorted
			var odd_evenMerge = function(st, n, dist){
				if(n > 2){
					odd_evenMerge(st, n/2, dist*2);
					odd_evenMerge(st+dist, n/2, dist*2);
					for(i=st+dist; i<(n*dist)+st-dist; i+=(dist*2))
						compareAndExchange(i, i+dist);
				}
				else if (n == 2)
					compareAndExchange(st, st+dist);
			}
			
			//input: sequence of numbers (st = start position in array; n = number of elements to sort from st)
			//output sequence sorted
			//NOTE: works only with 2^n number of elements
			var odd_evenMergeSort = function(st, n){
				if (n > 1){
					odd_evenMergeSort(st, n/2);
					odd_evenMergeSort(st+n/2, n/2);
					odd_evenMerge(st, n, 1);
				}
			}
		
		
		//jiff sorting
		//if input len hidden, computation is more expensive
		var jiff_sorting = function(inputs, len_hide = false){
			
			// final answer of this function here
			var deferred = $.Deferred();
			
			//step 1: padding.  This step has the goal of hiding parties's input lengths
			var inputs_len = $.Deferred();
			
			if (len_hide){
				var shares = mpc.jiffClient.share(inputs.length);
				var inputs_len_shr = shares[1];
				for (i=2;i<=mpc.jiffClient.party_count;i++){
					inputs_len_shr = inputs_len_shr.add(shares[i]);
				}
				len = mpc.jiffClient.open(inputs_len_shr);
				len.then(function(l){
					inputs_len.resolve(l);
				});
			}
			else{
				inputs_len.resolve(inputs.length);
			}
			
			inputs_len.then(function(len){
				var pad = new Array(len-inputs.length).fill(0);
				var my_inputs = inputs;
				my_inputs.push(...pad);
				
				//DEBUG
				//console.log("DEBUG: step 1 done");
				//step 2: compute sorting
				var arr_shares = mpc.jiffClient.share_array(my_inputs);
				var arrays_cocat;
				var array_positions_keys = []; 
				arr_shares.then(function(arrays_shares){	
					arrays_cocat = arrays_shares[1];
					//enumerate positions of elements
					pos = 0;
					for(i=0; i<arrays_shares[1].length; i++){
						pos+=1;
						array_positions_keys.push(pos);
					}
					//pushing for each pary his shares in a concatenated array
					for(i=2; i<=mpc.jiffClient.party_count; i++){
						arrays_cocat.push(...arrays_shares[i]);
						//pushing one by one the indexes of each party in a concatenated array
						for(j=0; j<arrays_shares[i].length; j++){
							pos+=1;
							array_positions_keys.push(pos);
						}
					}
					
					//we need to put the shares in object varibles, to use them in sorting algorithms above.
					mpc.sort_arr_conc = arrays_cocat;
					mpc.sort_arr_conc_key = array_positions_keys;
					
					// call sorting netowrk with params: start_position = 0, size = least power of two greater than array length;
					odd_evenMergeSort(0, 1 << 32 - Math.clz32(mpc.sort_arr_conc.length)); 
					//DEBUG
					console.log("DEBUG: sorting done, opening results..");
					
					if (len_hide){
						var result = mpc.jiffClient.open_array(mpc.sort_arr_conc_key.slice(mpc.sort_arr_conc_key.length-len, mpc.sort_arr_conc_key.length));
						result.then(function(res){
							deferred.resolve(len,res,mpc.sort_arr_conc.slice(mpc.sort_arr_conc.length-len, mpc.sort_arr_conc.length));
						});
					}
					else{
						var result = mpc.jiffClient.open_array(mpc.sort_arr_conc_key);
						result.then(function(res){
							deferred.resolve(len,res,mpc.sort_arr_conc);
						});
					}
				});
			});
			
			return deferred.promise(); 
			//promise contains: 
			// - length of the concatenation of all inputs 
			// - an array with the positions of inputs keys sorted (the result)
			// - an array containing the values, still in shared form sorted (for set intersection)
		}
		
		
		
		/**
     * Compute sorting for the given simple mpc instance
     * @method compute_sorting
     * @memberof simple_mpc.mpc
     * @instance
     * @param {list[integer]} value - the list used as this party input in the sorting
     * @returns {Ppromise Object} promise - promise to the result of the computation;
		 *					?
		 ?
		 ?
		 ?
		 *					 
     */ 
		mpc.compute_sorting = function(value, hide_input_len = false){
			if(value.some(isNaN))
				throw new Error('compute_sorting accepts an array of only positive integer values');
			
			//jiff comparison implementation
			if(implementation === 'jiff'){
				return promise = new Promise(function(resolve, reject) {
					try{
						//what to do after connection (i.e implementation of comparison operation)
						mpc.options.onConnect = function () {
							jiff_sorting(value, hide_input_len).then(function(len,res){
								mpc.result = res;
								resolve(mpc.result);
							});
						};
						if (mpc.jiffClient == null)
							//connecting to jiff, when all parties are connected, triggers the callback above.
							mpc.connect();
						else //else trigger directly the function to compute
						{
							
							jiff_sorting(value, hide_input_len).then(function(len,res){
								mpc.result = res;
								resolve(mpc.result);
							});
							
						}
					}catch(err){
						reject(err);
					}
				});//end promise
			}//end jiff case
			
			else if (implementation === 'jigg'){
				return promise = new Promise(function(resolve, reject) {
					try{
						var inputs = [];
						var pad = new Array(32).fill(0);
						
						value.forEach(function(val){
							var new_input = dec_to_binlist(val);
							new_input.push(...pad);
							new_input = new_input.slice(0,32)
							inputs.push(...new_input);
						}); 
						
						//push my input positions in input array
						if(mpc.jigg_role == 'Garbler')
							inputs.push(...[0,0,0,0,0,1,0,1,0,0,1,1]);
						else if (mpc.jigg_role == 'Evaluator')
							inputs.push(...[1,0,0,1,0,1,1,1,0,1,1,1]);
						
						const circuit = getCircuit("sorter_4+4input_32bits(from_compiler).txt");
						
						if (mpc.jiggClient == null || mpc.connected == false)
							mpc.connect();
						
						circuit.then(function(circuit){
							mpc.jiggClient.loadCircuit(circuit);
							mpc.jiggClient.setInput(inputs);

							// display progress and output
							mpc.jiggClient.addProgressListener(function (status, currentGate, totalGates, error) {
									console.log(status, currentGate, totalGates, error);
							});
							
							mpc.jiggClient.getOutput().then(function (outputs) {
								console.log('Output', outputs);
								mpc.jiggClient.disconnect(); // close the connection
								mpc.connected = false;
								
								res =	outputs;
								mpc.result = [];
								for(i=0; i<24; i+=3){
									mpc.result.push(parseInt(res.slice(i,i+3).join(''), 2));
								}
								//return result
								resolve(mpc.result);
							});

							// start
							mpc.jiggClient.start();
						});
					}catch(err){
						reject(err);
					}		
				});//end promise
			}//end jigg case
			
		}
		
		//_____________________________________________________________________
		//function 3: set intersection
		
		//check equality from selected indexes, and push in result the element if all equal, or 0 otherwise
		// shares | Array<SecretShares> | contain the shares of the inputs
		// shares_indexes | Array<int> | contains the indexes on wich perform the equality check
		// result | Array<SecretShares> | result in secret shared form
		function shares_list_equality(shares,shares_indexes,result){
			var pre_result = shares[1][shares_indexes[0]].eq(shares[2][shares_indexes[1]]);
			//if there are more than 2 parties, the computation checks if all inputs are equal
			for (i=3;i<=mpc.jiffClient.party_count;i++){
				pre_result = pre_result.mult(shares[1][shares_indexes[0]].eq(shares[i][shares_indexes[i-1]]));
			}
			
			result.push(shares[1][shares_indexes[0]].mult(pre_result));
			
		}
		
		//utility for PairwiseComparison in JIFF
		//this function create N nested for loops (one for each parties)
		// shares = SecretShare | the secret shares arrays used to perform the secure computation
		// tot_loops = int | the number of nested for loops desired
		// iterations_nums = Array<int> | an array where each element specifies the number of iterations of the i-th element
		// indexes = Array<int> | an array where each element is an index of the loop --- init always with [0,0, ..., 0]
		// result = Array<int> | array containing all elements in the intersection --- init always with []
		var recursivePairwiseComparisons = function(shares,tot_loops,iterations_nums,indexes,result){
			var N = iterations_nums[0];
			iterations_nums = iterations_nums.slice(1,iterations_nums.length);
			for(var i=0; i<N; i++){
				console.log(N);
				indexes[tot_loops - iterations_nums.length -1] = i;
				if(iterations_nums.length > 0)
					recursivePairwiseComparisons(shares,tot_loops,iterations_nums,indexes,result);
				else{
					//here the code that should be inside the last nested loop
					console.log(indexes);
					//check equality from selected indexes, and push in result the element if all equal, or 0 otherwise
					shares_list_equality(shares,indexes,result);
				}
			}
		}
		
		
		var jiff_pairwiseComparisons = function(shares, iterations_nums, result){
			
			indexes_array = [];
			for(i=0; i<mpc.jiffClient.party_count; i++)
				indexes_array.push(0);
			
			recursivePairwiseComparisons(shares,mpc.jiffClient.party_count,iterations_nums,indexes_array,result);
			
		}
		
		
		/*
		Algorithm 1 PairwiseComparisons(S, S0)
		1: for i 1 to S0:size do
		2: matched[i] False
		3:
		4: for i 1 to S:size do
		5: for j 1 to S0:size do
		6: if :matched[j] and	Equal(S[i];S0[j])	then
		7: reveal(S[i])
		8: matched[j] True
		9: break
		*/
		//PSI using PairwiseComparisons
		
		mpc.array_sizes = [];
		
		var jiff_intersection_1 = function(inputs){
			
			var deferred = $.Deferred();
			mpc.intersection_res = [];
			
			//step 1: reveal input sizes in plain text
			revealInputSizes(mpc.jiffClient,inputs.length,mpc.array_sizes);
			
			//step 2 share inputs in secret shared form
			var arr_shares = mpc.jiffClient.share_array(inputs);
			
			arr_shares.then(function(arrays_shares){
				jiff_pairwiseComparisons(arrays_shares, mpc.array_sizes, mpc.intersection_res);
				
				//open result
				var result = mpc.jiffClient.open_array(mpc.intersection_res);
				result.then(function(res){
					res = res.filter(function(a){return a !== 0}); //remove zero values
					var unique_res = [];
					//remove dupplicates in result
					$.each(res, function(i, el){
							if($.inArray(el, unique_res) === -1) unique_res.push(el);
					});
					deferred.resolve(unique_res);
				});
			});			
			
			//open result
			/*var result = mpc.jiffClient.open_array(mpc.intersection_res);
			result.then(function(res){
				console.log("DEBUG: filtering done!");
				res = res.filter(function(a){return a !== 0}); //remove zero values
				var unique_res = [];
				//remove dupplicates in result
				$.each(res, function(i, el){
						if($.inArray(el, unique_res) === -1) unique_res.push(el);
				});
				deferred.resolve(unique_res);
			});
			*/
			return deferred.promise();
		}
		
		//jiff functions for private set intersection_2(Sort-Compare-Shuffle) ... it works only for two-party
		var DupSelect_2 = function(share1,share2){
			var matching = share1.eq(share2);
			return share1.mult(matching);
		}
		
		var selectNvalues = function(shares_array){
			var matching = 1;
			first_share = shares_array[0];
			//remove first element to skip a usless comparison below
			shares_array = shares_array.slice(1,shares_array.length);
			
			shares_array.forEach(function(shr){
				matching = (first_share.eq(shr)).mult(matching);
			});

			return first_share.mult(matching);
		}
		
		//PSI using  Sort-Compare-Shuffle Algorithm
		var jiff_intersection_2 = function(inputs){
			var deferred = $.Deferred();
			mpc.intersection_res = [];
			
			//DBG timing
			start_time = performance.now();
			
			//this algorithm needs to sort first.
			jiff_sorting(inputs).then(function(len,positions,val_shares){
				console.log("DEBUG: sorting done!");
				//DBG timing
				end_time = performance.now()
				tot_comp_time = (end_time-start_time)/1000;
				console.log("sorting done in: " + tot_comp_time + "s");
				start_time_2 = performance.now();
				
				//DBG
				//console.log(len);
				//console.log(positions);
				//console.log(val_shares);
				//DBG
				
				n_party = mpc.jiffClient.party_count;
				for(i=0; i<=len-n_party; i++){
					//mpc.intersection_res.push(DupSelect_2(val_shares[i],val_shares[i+1]));
					shares = [];
					for(j=0;j<n_party; j++)
						shares.push(val_shares[i+j]);
					mpc.intersection_res.push(selectNvalues(shares));
				}
				//open result
				var result = mpc.jiffClient.open_array(mpc.intersection_res);
				result.then(function(res){
					console.log("DEBUG: filtering done!");
					//DBG timing
					end_time_2 = performance.now()
					tot_comp_time = (end_time_2-start_time_2)/1000;
					console.log("filtering done in: " + tot_comp_time + "s");

					res = res.filter(function(a){return a !== 0}); //remove zero values
					var unique_res = [];
					//remove dupplicates in result
					$.each(res, function(i, el){
							if($.inArray(el, unique_res) === -1) unique_res.push(el);
					});
					deferred.resolve(unique_res);
				});
			});
			return deferred.promise();
		}
		
		//utility jigg set intersection
		// using Pairwise Comparisons Algorithm
		/*	i,j = loop indexes
				inputs = this party input list
				matched = list of elements that matched	or not
				result = list of mathced elements to return as result */
		jigg_intersect_loop = function(i,j,inputs,matched,result){
			
			var deferred = $.Deferred();
			mpc.connect();
			
			const circuit = getCircuit("32bit_equality.txt");
			circuit.then(function(circuit){
				mpc.jiggClient.loadCircuit(circuit);
				
				//set input
				if(mpc.jigg_role == 'Garbler')
					mpc.jiggClient.setInput(inputs[i],'number');
				else if(mpc.jigg_role == 'Evaluator')
					mpc.jiggClient.setInput(inputs[j],'number');
				// start
				mpc.jiggClient.start();
				mpc.jiggClient.getOutput().then(function(output){
					//add a little delay
					setTimeout(function(){
						console.log('Output', output);
						
						if((!matched[j]) && output == 1){
							//garbler and evaluator pushes their input only
							if(mpc.jigg_role == 'Garbler' && (!result.includes(inputs[i]))) //this prevent to insert duplicates in the intersection
								result.push(inputs[i]);
							else if(mpc.jigg_role == 'Evaluator' && (!result.includes(inputs[j]))) //this prevent to insert duplicates in the intersection
								result.push(inputs[j]);
					
							matched[j] = true;
						}
						j+=1;
						if(j>=inputs.length){
							j = 0;
							i+=1;
						}
						if(i<inputs.length){ //continue the loop
							deferred.resolve(jigg_intersect_loop(i,j,inputs,matched,result));
						}
						else{
							deferred.resolve(result);
						}
					},33) //delay (ms)
				});
			});
			
			return deferred.promise();
		}
		
		//jigg function for private set intersection (PairwiseComparisons)
		var jigg_intersection_1 = function(inputs){
			// final answer of this function here
			var deferred = $.Deferred();
			
			var matched = [];
			var result = [];
			
			//init matched array
			for(i=0; i<inputs.length; i++)
				matched[i] = false;
			
			//here we simulate two for loops, with promis -> then sequences
			//for(i=0; i<value.length; i++)
			//	for(j=0; j<value.length; j++)
			// <-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***->
			// <-***-> non posso usare due veri for loop, perchè per ogni ciclo, devo richimare un nuovo circuito,										<-***->
			// <-***-> e attendere il risultato del precedente, prima di procedere a valutare gli elementi successivi,								<-***->
			// <-***-> (altrimenti inserirei dupplicati nell'array result). Inoltre, i vari circuiti di compute_equality si 					<-***->
			// <-***-> "incastrerebbero" tra di loro durante la computazione, e il server JIGG può gesirne uno solo alla volta... 		<-***->
			// <-***-> PARALLELISMO DIFFICILE CON JIGG...... 																																					<-***->
			// <-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***-><-***->
			deferred.resolve(jigg_intersect_loop(0,0,inputs,matched,result));
			
			
			return deferred.promise();	
		}
		
		
		//jigg function for private set intersection part 2 (Sort-Compare-Shuffle)
		var jigg_intersection_2 = function(user_inputs){
			// final answer of this function here
			var deferred = $.Deferred();
			
			/////////////////////
			//////////////////////
			var inputs = [];
			var pad = new Array(32).fill(0);
			
			user_inputs.forEach(function(val){
				var new_input = dec_to_binlist(val);
				new_input.push(...pad);
				new_input = new_input.slice(0,32)
				inputs.push(...new_input);
			}); 
			
			//push my input positions in input array
			if(mpc.jigg_role == 'Garbler')
				inputs.push(...[0,0,0,0,0,1,0,1,0,0,1,1]);
			else if (mpc.jigg_role == 'Evaluator')
				inputs.push(...[1,0,0,1,0,1,1,1,0,1,1,1]);
			
			const circuit = getCircuit("PSI(sort-comp-shuf)_4+4+inputs_32bit.txt");
			
			if (mpc.jiggClient == null || mpc.connected == false)
				mpc.connect();
			
			circuit.then(function(circuit){
				mpc.jiggClient.loadCircuit(circuit);
				mpc.jiggClient.setInput(inputs);

				// display progress and output
				mpc.jiggClient.addProgressListener(function (status, currentGate, totalGates, error) {
						console.log(status, currentGate, totalGates, error);
				});
				
				mpc.jiggClient.getOutput().then(function (outputs) {
					console.log('Output', outputs);
					mpc.jiggClient.disconnect(); // close the connection
					mpc.connected = false;
					
					res =	outputs;
					mpc.result = [];
					for(i=0; i<224; i+=32){
						mpc.result.push(parseInt(res.slice(i,i+32).reverse().join(''), 2));
					}
					mpc.result = mpc.result.filter(function(a){return a !== 0}); //remove zero values
					//return result
					deferred.resolve(mpc.result);
				});
				// start
				mpc.jiggClient.start();
			});

			///////////////////////
			//////////////////////
			
			
			
			return deferred.promise();	
		}
		
		/**
     * Compute private set intersection for the given simple mpc instance
     * @method compute_sorting
     * @memberof simple_mpc.mpc
     * @instance
     * @param {list[integer]} value - the list used as this party input in the intersection
																			!!! all parties must provide lists of the same size
     * @returns {Ppromise Object} promise - promise to the result of the computation;
		 *														the promise contains an array with elements in the intersection 
		 *					
		 ?
		 ?
		 ?
		 *					 
     */ 
		mpc.compute_intersection = function(value){
			if(value.some(isNaN))
				throw new Error('compute_intersection accepts an array of only positive integer values');
			
			//jiff implementation  WORK IN PROGRESS...
			if(implementation === 'jiff'){
				return promise = new Promise(function(resolve, reject) {
					try{
						//what to do after connection (i.e implementation of comparison operation)
						
						mpc.options.onConnect = function () {
						
							mpc.result = jiff_intersection_1(value); //switch version 1 or 2 here and below
							resolve(mpc.result);
						};
						if (mpc.jiffClient == null)
							//connecting to jiff, when all parties are connected, triggers the callback above.
							mpc.connect();
						else //else trigger directly the function to compute
						{
							mpc.result = jiff_intersection_1(value); //switch version 1 or 2 here and above
							resolve(mpc.result);
						}
					}catch(err){
						reject(err);
					}
				});//end promise
			}//end jiff case
			
			else if (implementation === 'jigg'){
				return promise = new Promise(function(resolve, reject) {
					try{
						/*var inputs = [];
						var pad = new Array(32).fill(0);
						value.forEach(function(val){
							var new_input = dec_to_binlist(val);
							new_input.push(...pad);
							new_input = new_input.slice(0,32)
							inputs.push(new_input);
						}); */
						
						mpc.result = jigg_intersection_2(value);
						resolve(mpc.result);
			
					}catch(err){
						reject(err);
					}		
				});//end promise
			}//end jigg case
			
		}
		
		
		return mpc;		
	}
	
	// Exported API
	// For client
	//exports.make_jiff = make_jiff;
  //exports.mod = mod;
	exports.init_simple_mpc = init_simple_mpc;	
	exports.implementations_list = implementations_list;	
}((typeof exports == 'undefined' ? this.simple_mpc = {} : exports), typeof exports != 'undefined'));
