(function() {
	'use strict';

	var app = angular.module('cbRestAngular', [
		'ngRoute',
		'ngResource',
		'ui.bootstrap',
		'ngGrid',
		'ngSanitize',
		'ngCookies'
	]).config(['$routeProvider', function ($routeProvider) {
			$routeProvider.
				when('/dashboard', {templateUrl: '/views/dashboard.htm', controller: 'dashboardCtrl'}).
				when('/permissions', {templateUrl: '/views/settings/permission.htm', controller: 'permissionCtrl'}).
				when('/roles', {templateUrl: '/views/settings/role.htm', controller: 'roleCtrl'}).
				when('/users', {templateUrl: '/views/settings/user.htm', controller: 'userCtrl'}).
				when('/login', {templateUrl: '/views/security/login.htm', controller: 'loginController'}).
				when('/logout', {templateUrl: '/views/security/login.htm', controller: 'logoutController'}).
				when('/account/edit', {templateUrl: '/views/security/accountEdit.htm', controller: 'accountEntryCtrl'}).
			otherwise({redirectTo: '/dashboard'});
	}]);

	app.config(function ($provide, $httpProvider) {
		$provide.factory('manageAPIResponse', function($q) {
			return {
				response: function(response) {
					if(angular.isDefined(response.data.STATUS) && response.data.STATUS === "ERROR") {
						var errorMessage = "API Error: " + response.data.ERRORMESSAGE;
						//flashService.show(errorMessage, "error");
						console.error('ERROR in API: ', response.data.ERRORMESSAGE);
						response.data.apiError = true;
						return response;
					} else {
						return response;
					}
				},
				responseError: function(response) {
					if(response.status === 401) {
						sessionService.unset('authenticated');
						flashService.show(response.data.flash);
						$location.path('/login');
					}
					return $q.reject(response);
				}
			};
		});
		$httpProvider.interceptors.push('manageAPIResponse');
	});

	//define some globals
	app.run(function($rootScope, $location, authenticationService, flashService) {
		$rootScope.checkPermission = function(slug) {
			return authenticationService.checkPermission(slug);
		};

		$rootScope.isLoggedIn = function() {
			return authenticationService.isLoggedIn();
		};

		$rootScope.loggedInUser = authenticationService.getUser();

		if($location.$$absUrl.indexOf('.local') > 0) {
			$rootScope.apiURL = 'http://api.cbrestangular.local/index.cfm/API/v1/';
		}

		$rootScope.currentYear = new Date().getFullYear();

		$rootScope.$watch('isLoggedIn', function() {
			if(!$rootScope.isLoggedIn()) {
				console.warn('You are not logged in');
				flashService.show('You are not logged in', 'info');
				$location.path('/logout');
			}
		});
	});

	// Token Handler factory for wrapping calls with API tokens
	// http://nils-blum-oeste.net/angularjs-send-auth-token-with-every--request/
	app.factory('tokenHandler', function(authenticationService) {
		var tokenHandler = {};
		var token = "none";

		tokenHandler.get = function() {
			return authenticationService.getUser().APIUSERKEY;
		};
		// wrap given actions of a resource to send auth token with every request
		tokenHandler.wrapActions = function( resource, actions ) {
			// copy original resource
			var wrappedResource = resource;
			for (var i=0; i < actions.length; i++) {
				tokenWrapper( wrappedResource, actions[i] );
			}
			// return modified copy of resource
			return wrappedResource;
		};
		// wraps resource action to send request with auth token
		var tokenWrapper = function( resource, action ) {
			// copy original action
			resource['_' + action]  = resource[action];
			// create new action wrapping the original and sending token
			resource[action] = function( data, success, error) {
				return resource['_' + action]( angular.extend({}, data || {}, {APIUSERKEY: tokenHandler.get()}), success, error );
			};
		};
		return tokenHandler;
	});


	/*
	 * groupBy
	 * Define when a group break occurs in a list of items
	 * @param {array}  the list of items
	 * @param {String} then name of the field in the item from the list to group by
	 * @returns {array}	the list of items with an added field name named with "_new"
	 *					appended to the group by field name
	 * @example		<div ng-repeat="item in MyList  | groupBy:'groupfield'" >
	 *				<h2 ng-if="item.groupfield_CHANGED">{{item.groupfield}}</h2>
	 *				Typically you'll want to include Angular's orderBy filter first
	 */
	app.filter('groupBy', ['$parse', function ($parse) {
		return function (list, group_by) {
			var filtered = [];
			var prev_item = null;
			var group_changed = false;
			// this is a new field which is added to each item where we append "_CHANGED"
			// to indicate a field change in the list
			//was var new_field = group_by + '_CHANGED'; - JB 12/17/2013
			var new_field = 'group_by_CHANGED';

			// loop through each item in the list
			angular.forEach(list, function (item) {
				group_changed = false;
				// if not the first item
				if (prev_item !== null) {
					// check if any of the group by field changed
					//force group_by into Array
					group_by = angular.isArray(group_by) ? group_by : [group_by];
					//check each group by parameter
					for (var i = 0, len = group_by.length; i < len; i++) {
						if ($parse(group_by[i])(prev_item) !== $parse(group_by[i])(item)) {
							group_changed = true;
						}
					}
				} else {// otherwise we have the first item in the list which is new
					group_changed = true;
				}
				// if the group changed, then add a new field to the item to indicate this
				item[new_field] = (group_changed) ? true : false;
				filtered.push(item);
				prev_item = item;
			});
			return filtered;
		};
	}]);

})();