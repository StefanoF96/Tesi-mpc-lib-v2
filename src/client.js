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
				if (!mpc.jigg_role)
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
						
						const circuit = getCircuit("32bitequality.txt");
						
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
		
		
		//private functions utility for jiff sorting
		//
		//swap a and b in place, if a is greater than b_list
		//then the lower element is in position a, and the greater of the two is in position b.
		var compareAndExchange = function(a,b){
			if(b>= mpc.sort_arr_conc.length) //if b is not >= arr length, so also a's not
				return;
			else{
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
		var jiff_sorting = function(inputs){
			
			// final answer of this function here
			var deferred = $.Deferred();
			
			//step 1: padding.  This step has the goal of hiding parties's input lengths
			var shares = mpc.jiffClient.share(inputs.length);
			var inputs_len_shr = shares[1];
			for (i=2;i<=mpc.jiffClient.party_count;i++){
				inputs_len_shr = inputs_len_shr.add(shares[i]);
			}
			var inputs_len = mpc.jiffClient.open(inputs_len_shr);
			
			inputs_len.then(function(len){
				var pad = new Array(len-inputs.length).fill(0);
				var my_inputs = inputs;
				my_inputs.push(...pad);

				//step 2: compute sorting
				var arr_shares = mpc.jiffClient.share_array(my_inputs);
				var arrays_cocat;
				var array_positions = []; 
				arr_shares.then(function(arrays_shares){	
					arrays_cocat = arrays_shares[1];
					//enumerate positions of elements
					pos = 0;
					for(i=0; i<arrays_shares[1].length; i++){
						pos+=1;
						array_positions.push(pos);
					}
					for(i=2; i<=mpc.jiffClient.party_count; i++){
						arrays_cocat.push(...arrays_shares[i]);
						for(j=0; j<arrays_shares[i].length; j++){
						pos+=1;
						array_positions.push(pos);
					}
					}
					//mpc.sort_arr_conc = arrs[1];
					//mpc.sort_arr_conc.push(...arrs[2]);
					mpc.sort_arr_conc = arrays_cocat;
					mpc.sort_arr_conc_key = array_positions;
					
					// call sorting netowrk with params: start_position = 0, size = least power of two greater than array length;
					odd_evenMergeSort(0, 1 << 32 - Math.clz32(mpc.sort_arr_conc.length)); 
					
					var result = mpc.jiffClient.open_array(mpc.sort_arr_conc_key.slice(mpc.sort_arr_conc_key.length-len, mpc.sort_arr_conc_key.length));
					result.then(function(res){
						deferred.resolve(len,res);
					});			
				});
			});
			
			return deferred.promise();
			
		}
		
		
		
		
		/**
     * Compute sorting for the given simple mpc instance
     * @method compute_sorting
     * @memberof simple_mpc.mpc
     * @instance
     * @param {integer} value - the value used as this party input in the sorting
     * @returns {Ppromise Object} promise - promise to the result of the computation;
		 *					?
		 ?
		 ?
		 ?
		 *					 
     */ 
		 //TODO
		mpc.compute_sorting = function(value){
			if(value.some(isNaN))
				throw new Error('compute_sorting accepts an array of only positive integer values');
			
			//jiff comparison implementation
			if(implementation === 'jiff'){
				return promise = new Promise(function(resolve, reject) {
					try{
						//what to do after connection (i.e implementation of comparison operation)
						mpc.options.onConnect = function () {
							mpc.result = jiff_sorting(value);
							resolve(mpc.result);
						};
						if (mpc.jiffClient == null)
							//connecting to jiff, when all parties are connected, triggers the callback above.
							mpc.connect();
						else //else trigger directly the function to compute
						{
							mpc.result = jiff_sorting(value);
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
						var inputs = [];
						var pad = new Array(8).fill(0);
						
						value.forEach(function(val){
							var new_input = dec_to_binlist(val);
							new_input.push(...pad);
							new_input = new_input.slice(0,8)
							inputs.push(...new_input);
						}); 
						
						//push my input positions in input array
						if(mpc.jigg_role == 'Garbler')
							inputs.push(...[0,0,0,0,0,1,0,1,0,0,1,1]);
						else if (mpc.jigg_role == 'Evaluator')
							inputs.push(...[1,0,0,1,0,1,1,1,0,1,1,1]);
						
						const circuit = getCircuit("sorter_4+4input_8bits_new.txt");
						
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
			
		}
		
		
		
		
	//TODO: implementare funzione confronto e ugualianza per jigg
	//TODO: al posto di comparazione come pensata fino ad ora, potrei fare ritornare una mappa con
	//  		un ordinamento degli input dal più piccolo al più grande
		
		
		return mpc;		
	}
	
	// Exported API
	// For client
	//exports.make_jiff = make_jiff;
  //exports.mod = mod;
	exports.init_simple_mpc = init_simple_mpc;	
	exports.implementations_list = implementations_list;	
}((typeof exports == 'undefined' ? this.simple_mpc = {} : exports), typeof exports != 'undefined'));
