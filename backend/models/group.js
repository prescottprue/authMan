var db = require('./../lib/db');
var mongoose = require('mongoose');
var q = require('q');
var GroupSchema = new mongoose.Schema({
	name:{type:String, default:'', unique:true},
	accounts:[{type: mongoose.Schema.Types.ObjectId, ref:'User'}],
	applications:[{type:mongoose.Schema.Types.ObjectId, ref:'Application'}],
	createdAt: { type: Date, default: Date.now, index: true},
	updatedAt: { type: Date, default: Date.now, index: true}
});
/*
 * Set collection name
 */
GroupSchema.set('collection', 'groups');
/*
 * Setup schema methods
 */
GroupSchema.methods = {
	//Wrap query in promise
	saveNew:function(){
		var d = q.defer();
		console.log('this:', this);
		this.save(function (err, result){
			if(err) { d.reject(err);}
			if(!result){
				d.reject(new Error('New User could not be saved'));
			}
			d.resolve(result);
		});
		return d.promise;
	},
	addAccount:function(){
		//TODO: Handle adding an account to the group
	},

};
/*
 * Construct `User` model from `UserSchema`
 */
db.authBoss.model('Group', GroupSchema);

/*
 * Make model accessible from controllers
 */
var Group = db.authBoss.model('Group');
Group.collectionName = GroupSchema.get('collection');

exports.Group = db.authBoss.model('Group');