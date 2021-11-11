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
		for (i=3;i<=mpc_istance.party_count; i++){
			pre_result = pre_result.mult(shares[1].eq(shares[i]));
		}
		result = mpc_istance.jiffClient.open(pre_result);
		
		return result;
	}
	
	
	
	function init_simple_mpc(hostname, implementation, party_count, comp_id){
		
		var mpc = {};
		
		mpc.result = null;
		
		if (hostname == null)
			throw new Error('hostname not defined')
		if (!implementations_list.includes(implementation))
			throw new Error('implementation "'+ implementation +'" dosn\'t exists');
		
		mpc.hostname = hostname;
		mpc.implementation = implementation;
		mpc.comp_id = comp_id;
		
		//default options
		mpc.options = { party_count: party_count}; //metto statico il numero di party a 3 per ora...
		//what to do after an error occoured
    mpc.options.onError = function (_, error) {
      throw new Error('error in mpc');
    };
		mpc.options.crypto_provider = true;		
		
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
				mpc.jiffClient = new JIFFClient(mpc.hostname, mpc.comp_id, mpc.options);
				return mpc.jiffClient;
			}
		}
		
		/**
     * Compute equality for the given simple mpc instance
     * @method compute_equality
     * @memberof simple_mpc.mpc
     * @instance
     * @param {integer} value - the value used as this party input in the equality computation
     * @param {function} callback(val) - this function is called on 
     * @returns {Ppromise Object} promise - promise to the result of the computation
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
							mpc.jiffClient = new JIFFClient(mpc.hostname, mpc.comp_id, mpc.options);
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
			
		}
		
	//implementare funzione confronto per jiff e jigg
			
		
		
		return mpc;		
	}
	
	// Exported API
	// For client
	//exports.make_jiff = make_jiff;
  //exports.mod = mod;
	exports.init_simple_mpc = init_simple_mpc;	
	exports.implementations_list = implementations_list;	
}((typeof exports == 'undefined' ? this.simple_mpc = {} : exports), typeof exports != 'undefined'));
