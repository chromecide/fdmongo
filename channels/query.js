;!function(exports, undefined) {
	
	var channel = {
		name: 'mongodb',
		host: 'localhost',
		port: 27017,
		databaseName: 'Data',
		collectionName: 'Entities',
		changeCollectionPrefix: '_changes_'
	};
	
	channel.init = function(callback){
		var self = this;
		//late load the required modules
		var mongo = self.mongo = require('mongodb');
		var Server = mongo.Server;
		var Db = mongo.Db;
		
		//create the models
		self.Models.Query = new self._Model({
			name: 'MongoQuery',
			fields: [
				{
					name: 'items',
					label: 'Items',
					hasMany: true
				}
			]
		});
		
		self.server = new Server(self.host, self.port, self.mongo_options, {safe: true});
		
		var db = self.db = new Db(self.databaseName, self.server, {safe: true});
		//try and open the db
		
		self.db.open(function(err, db){
			if(err){
				throw new Error(err);
			}else{
				//load the collection
				
				loadCollection.call(self, self.collectionName, {}, function(err, coll){
					
					if(err){
						throw new Error(err);
					}

					self.collection = coll;
					if(callback){
						callback(self);
					}
					//load the changes feed
					/*loadCollection.call(self, function(err, changeColl){
						if(err){
							throw new Error(err);
						}
						self.changes_collection = changeColl;
					});*/
				});
			}
		});
	}
	
	channel.publish = function(entity, callback){
		var self = this;
		
		if((entity instanceof self.Entity)==false){
			entity = new self.Entity(self.Models.Command, entity);
		}
		
		entityToQuery(entity, function(err, query){
			self.collection.find(query, function(err, items){
				items.toArray(function(err, arr){
					var itemsEntity = new self._Entity({
						items: arr
					});
					self.emit('entity', itemsEntity);
				});
			});
		});
	}
	
	channel.find = function(query, fields, callback){
		var self = this;
		
		if((typeof query)=='function'){
			callback = query;
			query = {};
			fields = {};
		}
		
		if((typeof fields)=='function'){
			callback = fields;
			fields = {};
		}
		
		self.collection.find(query, fields).toArray(function(err, items){
			if(err){
				if(callback){
					callback(err, items);
				}
			}else{
				if(self.model){
					for(var i=0;i<items.length;i++){
						items[i] = self.instance(items[i]);
					}
					
					if(callback){
						callback(err, items);
					}
				}else{
					if(callback){
						callback(err, items);
					}
				}
			}
		});
	}
	
	//creates the changes collection if it doesn't already exist, 
	//and returns the collection in the callback
	function loadCollection(name, options, callback){
		
		var self = this;
		self.db.collectionNames(self.changeCollectionPrefix+self.collectionName, function (err, names) {
			var found = false;
			
			for(var i=0;i<names.length;i++){
				if(self.datbaseName+'.'+self.changeCollectionPrefix+self.collectionName){
					found = true;
					continue;
				}	
			}
			
			if(!found){
				//create the changes collection
				
				self.db.createCollection(self.changesCollectionPrefix+self.collectionName, options,function(err, coll){
					if(err){
						throw new Error(err);
					}
					
					if(callback){
						callback(false, coll)
					}
				});
			}else{
				self.db.collection(name, function(err, coll){
					if(err){
						throw new Error(err);
					}
					
					if(callback){
						callback(err, coll);
					}
					
				});
			}
		});
	}
	
	function entityToQuery(entity, callback){
		var queryItems = entity.get('items');
		
		var query = {
			
		};

		for(var i=0;i<queryItems.length;i++){
			var item = queryItems[i];
			
			switch(item.operator){
				default:
				case '=':
					query[item.attribute] = item.value;
					break;
				case '<':
					query[item.attribute] = {'$lt': item.value};
					break;
				case '<=':
					query[item.attribute] = {'$lte': item.value};
					break;
				case '>':
					query[item.attribute] = {'$gt': item.value};
					break;
				case '>=':
					query[item.attribute] = {'$gte': item.value};
					break;
				case 'in':
					query[item.attribute] = {'$in': item.value};
					break;
				case 'nin':
					query[item.attribute] = {'$nin': item.value};
					break;
			}
		}

		callback(false, query);
	}
	
	if (typeof define === 'function' && define.amd) {
		define(function() {
			return channel;
		});
	} else {
		exports.Channel = channel;
	}

}(typeof process !== 'undefined' && typeof process.title !== 'undefined' && typeof exports !== 'undefined' ? exports : window);