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
		for (i=3;i<=mpc_istance.party_count;i++){
			pre_result = pre_result.mult(shares[1].eq(shares[i]));
		}
		var result = mpc_istance.jiffClient.open(pre_result);
		
		return result;
	}
	
	//jigg comparison utility
	function dec_to_binlist(dec){
		b_list = (dec >>> 0).toString(2).split('').reverse();
		b_list.forEach(function (item, index) {
					b_list[index] = parseInt(b_list[index]);
				});
		return b_list;
	}	
	
	//quicksort utility
	function swap(items, leftIndex, rightIndex){
			var temp = items[leftIndex];
			items[leftIndex] = items[rightIndex];
			items[rightIndex] = temp;
	}
	//quicksort utility
	function partition(items, left, right) {
			var pivot   = items[Math.floor((right + left) / 2)], //middle element
					i       = left, //left pointer
					j       = right; //right pointer
			while (i <= j) {
					while (items[i].lt(pivot)) {
							i++;
					}
					while (items[j].gt(pivot)) {
							j--;
					}
					if (i <= j) {
							swap(items, i, j); //sawpping two elements
							i++;
							j--;
					}
			}
			return i;
	}
	
	//implementation of quicksort
	function jiffQuickSort(items, left, right) {
			var index;
			if (items.length > 1) {
					index = partition(items, left, right); //index returned from partition
					if (left < index - 1) { //more elements on the left side of the pivot
							jiffQuickSort(items, left, index - 1);
					}
					if (index < right) { //more elements on the right side of the pivot
							jiffQuickSort(items, index, right);
					}
			}
			return items;
	}
	
	
	// first call to quick sort
	//var sortedArray = quickSort(items, 0, items.length - 1);
	//console.log(sortedArray); //prints [2,3,5,6,7,9]
	
	
	function jiff_comparison_comp(mpc_istance, value){
		var shares = mpc_istance.jiffClient.share(value);
		
		//add an id to the shares, associtates to their holder, to retrive their sorting later.
		for (i=1;i<=mpc_istance.party_count;i++){
			shares[i].id = i;
		}
		var pre_result = jiffQuickSort(shares,1,mpc_istance.party_count);
		
		
		var result = mpc_istance.jiffClient.open(pre_result);
		
		return result;
	}
	
	
	//Funtions for jigg
	function getCircuit(circuit){
		return $.ajax('/jigg_circuits/' + circuit);
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
		
		//NO ENCRYPTION, FOR DEBUG ONLY!!!
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
				mpc.jiffClient.options.url = "/app/sound.mp3";
				
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
						
						const circuit = getCircuit("32bitcomparator.txt");
						
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
		
		
		/**
     * Compute comparison for the given simple mpc instance
     * @method compute_comparison
     * @memberof simple_mpc.mpc
     * @instance
     * @param {integer} value - the value used as this party input in the comparison
     * @returns {Ppromise Object} promise - promise to the result of the computation;
		 *					the result is 1 if all element are equals, 0 if party's element is the
		 *					smallest, 2 if party's element is the biggest, 3 if there are more than
		 * 					two parties, and the party's element isn't the biggest, nor the
		 *					smallest, nor it's equal to all other parties inputs
		 *					 
     */
		mpc.compute_comparison = function(value){
			//jiff comparison implementation
			if(implementation === 'jiff'){
				return promise = new Promise(function(resolve, reject) {
					try{
						//what to do after connection (i.e implementation of comparison operation)
						mpc.options.onConnect = function () {
							mpc.result = jiff_comparison_comp(mpc, value);
							resolve(mpc.result);
						};
						if (mpc.jiffClient == null)
							//connecting to jiff, when all parties are connected, triggers the callback above.
							mpc.connect();
						else //else trigger directly the function to compute
						{
							mpc.result = jiff_comparison_comp(mpc, value);	
							resolve(mpc.result);
						}
					}catch(err){
						reject(err);
					}
				});//end promise
			}//end jiff case
			
			
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
