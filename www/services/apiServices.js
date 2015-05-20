(function() {
	'use strict';

	var app = angular.module('cbRestAngular');

	//USERSERVICE
	app.factory('userService', function ($resource, tokenHandler, $rootScope) {
		var userServiceAPICall = $rootScope.apiURL + 'user/:id';
		var resource = $resource(userServiceAPICall, { id:'@id' }, {
			update: { method:'POST' }
		});

		resource = tokenHandler.wrapActions( resource, [ "query", "update", "save", "get", "delete", "getUsers" ]);

		return resource;
	});


	//PERMISSIONSERVICE
	app.factory('permissionService', function ($resource, tokenHandler, $rootScope) {
		var permissionServiceAPICall = $rootScope.apiURL + 'permission/:id';
		var resource = $resource(permissionServiceAPICall, { id:'@id' }, {
			update: { method:'POST' }
		});

		resource = tokenHandler.wrapActions( resource, [ "query", "update", "save", "get", "delete", "getPermissions", "getUserPermissions", "getRolePermissions" ]);

		return resource;
	});


	//ROLESERVICE
	app.factory('roleService', function ($resource, tokenHandler, $rootScope) {
		var roleServiceAPICall = $rootScope.apiURL + 'role/:id';
		var getRolesAPICall = $rootScope.apiURL + 'role/getRoles/';
		var resource = $resource(roleServiceAPICall, { id:'@id' }, {
			update: { method:'POST' },
			getRoles: { method:'GET', url:getRolesAPICall }
		});

		resource = tokenHandler.wrapActions( resource, [ "query", "update", "save", "get", "delete", "getRoles" ]);

		return resource;
	});


})();