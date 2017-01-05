//-------------------------------------------------------------------
// Marbles Chaincode - Marble Owner Functions
//-------------------------------------------------------------------
var path = require('path');

module.exports = function (chain, chaincode_id, logger) {
	var common = require(path.join(__dirname, './common.js'))();
	var users = {};

	//-------------------------------------------------------------------
	// Create User - options are {username: bob}
	//-------------------------------------------------------------------
	users.register_owner = function (webUser, peerUrls, args, cb) {
		console.log('\nCreating a user\n');

		// send proposal to endorser
		var request = {
			targets: peerUrls,
			chaincodeId: chaincode_id,
			fcn: 'init_owner',
			args: args 						//args == ["bob", "united marbles"]
		};
		console.log('!', args);
		webUser.sendTransactionProposal(request)
		.then(
			function (results) {
				var proposalResponses = results[0];
				var proposal = results[1];

				if (proposalResponses && proposalResponses[0] && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
					console.log('Successfully obtained transaction endorsement.' + JSON.stringify(proposalResponses));
					return webUser.sendTransaction(proposalResponses, proposal);
				}
				else {
					console.log('Failed to obtain transaction endorsement', proposalResponses);
					throw common.format_error_msg(proposalResponses[0]);
				}
			}
		).then(
			function (response) {
				if (response && response.Status === 'SUCCESS') {
					console.log('Successfully ordered endorsement transaction.');
					if(cb) return cb(null, null);
					else return;
				}
				else {
					console.log('Failed to order the endorsement of the transaction. Error code: ', response);
					throw response;
				}
			}
		).catch(
			function (err) {
				console.log('error in catch block', typeof err, err);
				var e = null;
				if(typeof err === 'string' && err.indexOf('owner already exists')){
					e = err;
				}
				if(cb) return cb(e, null);
				else return;
			}
		);
	};

	//-------------------------------------------------------------------
	// Get Owner Index List
	//----------------------------------------------------
	users.get_owner_list = function (webUser, peerUrls, cb) {
		console.log('\nFetching owner index list...');
		var request = {
			targets: peerUrls,
			chaincodeId: chaincode_id,
			fcn: 'read',
			args: ['_ownerindex']
		};

		webUser.queryByChaincode(request)
		.then(
			function(response_payloads) {
				if(response_payloads.length <= 0){
					console.log('! Query response is empty: ');
					if(cb) return cb({error: 'query response is empty'}, null);
				}
				else{

					// -- send formated response -- //
					var formated = common.format_query_resp(response_payloads, 'owners');
					if(cb) return cb(formated.error, formated.ret);
				}
			}
		)
		.catch(
			function (err) {
				if(cb) return cb(err, null);
			}
		);
	};


	//-------------------------------------------------------------------
	// Format Owner's Actual Key Name
	//----------------------------------------------------
	users.build_owner_name = function(username, company){
		return username.toLowerCase() + '.' + company;
	};
	

	//-------------------------------------------------------------------
	// Get a Owner
	//----------------------------------------------------
	users.get_owner = function (webUser, peerUrls, opts, cb) {
		console.log('\nFetching owner ' + users.build_owner_name(opts.username, opts.company) + ' list...');
		var request = {
			targets: peerUrls,
			chaincodeId: chaincode_id,
			fcn: 'read',
			args: [users.build_owner_name(opts.username, opts.company)]
		};

		webUser.queryByChaincode(request)
		.then(
			function(response_payloads) {
				if(response_payloads.length <= 0){
					console.log('! Query response is empty: ');
					if(cb) return cb({error: 'query response is empty'}, null);
				}
				else{

					// -- send formated response -- //
					var formated = common.format_query_resp(response_payloads);
					if(cb) return cb(formated.error, formated.ret);
				}
			}
		).catch(
			function (err) {
				if(cb) return cb(err, null);
			}
		);
	};

	return users;
};

