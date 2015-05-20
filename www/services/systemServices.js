(function() {
	'use strict';

	var app = angular.module('cbRestAngular');

	//flashService
	app.factory("flashService", function ($rootScope, $timeout) {
		return {
			show: function(message,type) {
				$rootScope.gotFlash = true;
				$rootScope.flash = message;
				if(type === undefined) {
					type="success";
				}
				$rootScope.messagetype = type;
				$timeout(function() {
					$rootScope.gotFlash = false;
				}, 3000).then( function() {
					$timeout(function() {
						$rootScope.flash = "";
					}, 1000);
				});
			},
			clear: function() {
				$rootScope.flash = "";
			},
			reset: function() {
				$timeout(function() {
					$rootScope.flash = "";
				}, 1000);
			},
		};
	});


	app.factory("sessionService", function() {
		return {
			get: function(key) {
				return sessionStorage.getItem(key);
			},
			set: function(key, val) {
				return sessionStorage.setItem(key, val);
			},
			unset: function(key) {
				return sessionStorage.removeItem(key);
			}
		};
	});


	//authenticationService
	app.factory("authenticationService", function ($http, $sanitize, $rootScope, sessionService, flashService) {
		var cacheSession = function(data) {
			sessionService.set('user',JSON.stringify(data.USER));
			sessionService.set('authenticated', true);
		};

		var uncacheSession = function() {
			sessionService.unset('user');
			sessionService.unset('authenticated');
		};

		var loginError = function(response) {
			flashService.show(response.flash);
		};

		var sanitizeCredentials = function(credentials) {
			return {
				username: $sanitize(credentials.username),
				password: $sanitize(credentials.password),
			};
		};

		var sanitizeChangePasswordCredentials = function(credentials) {
			return {
				username: $sanitize(credentials.username),
				currentpassword: $sanitize(credentials.currentpassword),
				newpassword: $sanitize(credentials.newpassword),
				confirmpassword: $sanitize(credentials.confirmpassword),
			};
		};

		var sanitizeAdminChangePasswordCredentials = function(credentials) {
			return {
				adminChangePassword: credentials.adminChangePassword,
				username: $sanitize(credentials.username),
				newpassword: $sanitize(credentials.newpassword),
				confirmpassword: $sanitize(credentials.confirmpassword)
			};
		};

		var checkForPermission = function (slug) {
			var user = sessionService.get('user');
			if(user === null) {
				return false;
			} else {
				var user = JSON.parse(user);
				var permissions = user.permissionList + user.role.permissionList;
				return (permissions.indexOf(slug) != "-1") ? true : false;
			}
		};

		return {
			login: function(credentials) {
				var loginURL = $rootScope.apiURL + 'auth/login';
				var login = $http.post(loginURL, sanitizeCredentials(credentials)).success(function (data) {
					if(data.RESULT === true) {
						cacheSession(data);
						//console.log(data.USER.APIUSERKEY);
						flashService.clear();
					} else if(data.RESULT === false) {
						flashService.show("These aren't the credentials we're looking for. Please try again.", "error");
					}
				}).error(function(loginError) {
					console.error("Something went wrong w/the login!");
				});
				return login;
			},
			generateTemporaryPassword: function(userEmail) {
				var tempPasswordURL = $rootScope.apiURL + 'auth/makeTemporaryPassword';
				var generateTemporaryPassword = $http.post(tempPasswordURL, $sanitize(userEmail)).success(function (data) {
					console.info('Temporary password successfully generated.');
				}).error(function() {
					console.error('Error when generating temporary password');
				});
				return generateTemporaryPassword;
			},
			changePassword: function(credentials) {
				var changePasswordURL = $rootScope.apiURL + "auth/changePassword";
				var changePassword = $http.post(changePasswordURL, sanitizeChangePasswordCredentials(credentials)).success(function (data) {
					if(data.RESULT === true) {
						cacheSession(data);
						flashService.show("Password successfully changed", "info");
					}
				}).error(function() {
					flashService.show("Error when changing password.", "error");
				});
				return changePassword;
			},
			adminChangePassword: function(credentials) {
				var changePasswordURL = $rootScope.apiURL + "auth/changePassword";
				var changePassword = $http.post(changePasswordURL, sanitizeAdminChangePasswordCredentials(credentials));
				return changePassword;
			},
			logout: function() {
				uncacheSession();
				return true;
			},
			isLoggedIn: function() {
				return sessionService.get('authenticated');
			},
			getUser: function() {
				return JSON.parse(sessionService.get('user')) == null ? {} : JSON.parse(sessionService.get('user'));
			},
			checkPermission: function(slug) {
				return checkForPermission(slug);
			},
			setUser: function(userID) {
				var updateUserURL = $rootScope.apiURL + 'auth/updateUser';
				var userdata = $http.post(updateUserURL, {userID: userID}).success(function (data) {
					if(data.RESULT === true) {
						cacheSession(data);
						flashService.clear();
					}
				});
			}
		};
	});
})();