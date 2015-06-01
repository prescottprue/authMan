var User = require('../models/user').User;
var mongoose = require('mongoose');
var url = require('url');
/**
 * @description Authentication controller functions
 */
/** Login Ctrl
 * @description Log an existing user in
 * @params {String} email - Email of user
 * @params {String} password - Password of user
 */
exports.login = function(req, res, next){
	var query = User.findOne({"email":req.email});
	//TODO:Check encrypted password against db
	//TODO:Create a new session
	//TODO:Encode a JWT with session + user info
	query.exec(function (err, result){
		if(err) { return next(err);}
		if(!result){
			return next (new Error('User could not be found'));
		}
		res.send(result);
	});
};

/** Signup Ctrl
 * @description Allow new user to signup
 * @params {String} name - Name of new user
 * @params {String} email - Email of new user
 * @params {String} password - Password of new user
 */
exports.signup = function(req, res, next){
	//TODO:Check that user doesn't already exist
	//TODO:Create a new user with provided info
};
/** Logout Ctrl
 * @description Log a current user out and invalidate token
 * @params {String} email - Email of user
 */
exports.logout = function(req, res, next){
	//TODO:Invalidate token
	//TODO:Destroy session
};

/** Verify Ctrl
 * @description Verify that a token is valid and return user data
 * @params {String} email - Email of user
 */
exports.verify = function(req, res, next){
	//TODO:Verify Token
	//TODO:Get user based on token data
	//TODO:Return user info
};