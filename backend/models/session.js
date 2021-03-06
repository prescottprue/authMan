var db = require('./../lib/db');
var mongoose = require('mongoose');

var SessionSchema = new mongoose.Schema({
	userId:{type: mongoose.Schema.Types.ObjectId, ref:'User'},
	active:{type: Boolean, default:true},
	createdAt: { type: Date, default: Date.now, index: true},
	endedAt: { type: Date, index: true},
	updatedAt: { type: Date, default: Date.now, index: true}
});

SessionSchema.set('collection', 'sessions');
/*
 * Construct `User` model from `UserSchema`
 */
db.authBoss.model('Session', SessionSchema);

/*
 * Make model accessible from controllers
 */
var Session = db.authBoss.model('Session');
Session.collectionName = SessionSchema.get('collection');

exports.Session = db.authBoss.model('Session');