;!function(exports, undefined) {
	
	var collectionChannel = require(__dirname+'/channels/collection.js').Channel;
	var queryChannel = require(__dirname+'/channels/query.js').Channel;
	
	var channels = {
		Collection: collectionChannel,
		Query: queryChannel
	};
	
	if (typeof define === 'function' && define.amd) {
		define(function() {
			return channels;
		});
	} else {
		exports.Channels = channels;
	}

}(typeof process !== 'undefined' && typeof process.title !== 'undefined' && typeof exports !== 'undefined' ? exports : window);