var bcrypt = require('bcrypt');
var _ = require('underscore');

module.exports = function(sequelize, DataTypes) {
	var user = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		salt: {
			type: DataTypes.STRING,
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 100]
			},
			set: function(value) {
				var salt = bcrypt.genSaltSync(10);
				var hashedPassword = bcrypt.hashSync(value, salt);

				this.setDataValue('password', value);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}
	}, {
		hooks: {
			beforeValidate: function(user, options) {
				if (typeof user.email === 'string')
					user.email = user.email.toLowerCase();
			}
		},
		instanceMethods: {
			toPublicJSON: function() {
				var json = this.toJSON();
				return _.pick(json,
					'id',
					'email',
					'createdAt',
					'updatedAt'
				);
			}
		},
		classMethods: {
			authenticate: function(body) {
				return new Promise(function(resolve, reject) {
					if (_.isString(body.email) && _.isString(body.password)) {
						user.findOne({
							where: {
								email: body.email
							}
						}).then(function(user) {
							if (user && bcrypt.compareSync(body.password, user.get('password_hash'))) //1st arg - plain text pass 2nd arg - Hashed password
								resolve(user);
							else
								reject();
						}, function(e) {
							reject();
						})
					} else {
						return reject();
					}
				})
			}
		}
	})
	return user;
}