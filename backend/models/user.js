var db = require('./../lib/db');
var mongoose = require('mongoose');
var _ = require('underscore');
var sessionCtrls = require('../controllers/session');
var Session = require('./session').Session;
var Q = require('q');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var config = require('../config/default').config;

//Schema Object
//collection name
//model name

var UserSchema = new mongoose.Schema(
	{
		username:{type:String, index:true},
		name:{type: String, default:''},
		email:{type: String, default:'', index:true},
		title:{type: String, default:''},
		password:{type: String, default:''},
		role:{type: String, default:''},
		sessionId:{type:String},
		createdAt: { type: Date, default: Date.now, index: true},
		updatedAt: { type: Date, default: Date.now, index: true}
	},
	{
		toJSON:{virtuals:true}
	}
);
/*
 * Set collection name to 'user'
 */
UserSchema.set('collection', 'users');


// UserSchema.virtual('id')
// .get(function (){
// 	return this._id;
// })
// .set(function (id){
// 	return this._id = id;
// });
UserSchema.methods = {
	//Remove values that should not be sent
	strip: function(){
		return _.omit(this.toJSON(), ["password", "__v", "_id", '$$hashKey']);
	},
	tokenData: function(){
		var data = _.pick(this.toJSON(), ["username", "role"]);
		console.log('[User.tokenData()] role:', data.role);
		data.userId = this.toJSON().id;
		return data;
	},
		//Log user in
	login:function(passwordAttempt){
		var d = Q.defer();
		var self = this;
		//Check password
		console.log("[User.login()] Compare returned:", passwordAttempt);
		self.comparePassword(passwordAttempt).then(function(){
			//Start new session
			console.log("[User.login()] Passwords match");
			self.startSession().then(function(sessionInfo){
				//Create Token
				console.log("[User.login()] Session started:", sessionInfo);
				var token = self.generateToken(sessionInfo);
				console.log("[User.login()] Token Generated:", token);
				d.resolve(token);
			}, function(err){
				d.reject(err);
			});
		}, function(err){
			d.reject(err);
		});
		return d.promise;
	},
	comparePassword: function(passwordAttempt){
		var self = this;
		var d = Q.defer();
		bcrypt.compare(passwordAttempt, self.password, function(err, passwordsMatch){
			console.log("[User.checkPassword()] Compare returned:", err, passwordsMatch);
			if(err){d.reject(err);}
			if(!passwordsMatch){
				d.reject(new Error('Invalid authentication credentials'));
			}
			d.resolve(true);
		});
		return d.promise;
	},
	generateToken: function(session){
		//Encode a JWT with user info
		var tokenData = this.tokenData();
		tokenData.sessionId = session._id;
		return jwt.sign(tokenData, config.jwtSecret);
	},
	//Wrap query in promise
	saveNew:function(){
		var d = Q.defer();
		this.save(function (err, result){
			if(err) { d.reject(err);}
			if(!result){
				d.reject(new Error('New User could not be saved'));
			}
			d.resolve(result);
		});
		return d.promise;
	},
	//Create a new session with user information attached
	startSession: function(){
		//Create new session
		/** New Session Function
		 * @description Create a new session and return a promise
		 * @params {String} email - Email of Session
		 */
		//Session does not already exist
		var deferred = Q.defer();
		console.log('[User.startSession()] Starting session for user with id:', this._id);
		var session = new Session({userId:this._id});
		session.save(function (err, result) {
			if (err) { deferred.reject(err); }
			if (!result) {
				deferred.reject(new Error('Session could not be added.'));
			}
			console.log('[User.startSession()] Session started successfully. Returning:', result);
			deferred.resolve(result);
		});
		return deferred.promise;
	},
	endSession: function(){
		//Find current session and mark it as ended
		//Set active to false
		console.log('[User.endSession()] Ending session with id:', this.sessionId);
		/** End Session Function
		 * @description Create a new session and return a promise
		 * @params {String} email - Email of Session
		 */
		var deferred = Q.defer();
		//Find session by userId and update with active false
		Session.update({_id:this.sessionId, active:true}, {active:false, endedAt:Date.now()}, {upsert:false}, function (err, affect, result) {
			console.log('[User.endSession()] Session update:', err, affect, result);
			if (err) { deferred.reject(err); }
			if (!result) {
				deferred.reject(new Error('Session could not be added.'));
			}
			if(affect.nModified != 1){
				console.log('[User.endSession()] Multiple sessions were ended', affect);
			}
			console.log('[User.endSession()] Returning', result);

			deferred.resolve(result);
		});
		return deferred.promise;
	},
	hashPassword:function(password){
		var d = Q.defer();
		console.log('[User.hashPassword()] Hashing password');
		bcrypt.genSalt(10, function(err, salt) {
			if(err){
				console.log('[User.hashPassword()] Error generating salt:', err);
				d.reject(err);
			}
		  bcrypt.hash(password, salt, function(err, hash) {
				//Add hash to userData
				if(err){
					console.log('[User.hashPassword()] Error Hashing password:', err);
					d.reject(err);
				}
				d.resolve(hash);
			});
		});
		return d.promise;
	},
	createWithPass:function(password){
		//TODO: Hash password
		//Save new user with password
		var d = Q.defer();
		var self = this;
		self.hashPassword(password).then(function (hashedPass){
			self.password = hashedPass;
			console.log('[User.createWithPass()] Password hashed successfully');
			self.saveNew().then(function(newUser){
				console.log('[User.createWithPass()] New user created:', newUser);
				d.resolve(newUser);
			}, function(err){
				d.reject(err);
			});
		}, function(err){
			d.reject(err);
		});
		return d.promise;
	}
};
/*
 * Construct `User` model from `UserSchema`
 */
db.authBoss.model('User', UserSchema);
/*
 * Make model accessible from controllers
 */
var User = db.authBoss.model('User');
User.collectionName = UserSchema.get('collection');

exports.User = db.authBoss.model('User');
