(function() {
	'use strict';

	var app = angular.module('cbRestUser', []);

	app.controller('userCtrl', function ($scope, $modal, userService, roleService, $timeout, flashService) {
		roleService.getRoles().$promise.then(function (resp) {
			if(angular.isDefined(resp.apiError)) {
				$scope.roles = [];
				console.warn("API error when loading roles");
			} else {
				$scope.roles = resp;
			}
		});

		$scope.sortInfo = {
			fields:['LASTNAME'],
			directions:['asc']
		};

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.refreshUsers = function() {
			$scope.gettingUsers = true;
			userService.query({
				iSortCol_0:$scope.sortInfo.fields[0],
				sSortDir_0:$scope.sortInfo.directions[0]
			}).$promise.then(function (resp) {
				$scope.gettingUsers = false;
				if(angular.isDefined(resp.apiError)) {
					$scope.users = [];
					console.warn("API error when loading users");
				} else {
					$scope.users = resp;
					$scope.totalServerItems = (resp.length) ? resp[0].ITOTALRECORDS : 0;
				}
			});
		};
		$scope.refreshUsers();

		var actions =
			'<div class="gridActions ngCellText" ng-class="col.colIndex()">' +
				'<a class="btn btn-mini" ng-if="checkPermission(\'USER_ADD/EDIT\')" ng-click="manageUser(row)" rel="tooltip" title="Edit">' +
					'<i class="icon-pencil icon-black"></i></a>' +
				'<a class="btn btn-mini" ng-if="checkPermission(\'USER_ADMIN\')" ng-click="changeUserPassword(row.getProperty(\'USERID\'))" rel="tooltip" title="Change User Password">' +
					'<i class="icon-exclamation-sign icon-black"></i></a>' +
				'<a data-toggle="modal" ng-if="checkPermission(\'USER_ADMIN\')" ng-click="deleteUser(row.getProperty(\'USERID\'))" class="btn btn-mini confirm-delete" rel="tooltip" title="Delete">' +
					'<i class="icon-trash icon-black"></i></a>' +
			'</div>';

		$scope.userGrid = {
			data: 'users',
			showFooter: true,
			enableRowSelection: false,
			filterOptions: $scope.filterOptions,
			sortInfo: $scope.sortInfo,
			useExternalSorting: false,
			totalServerItems: 'totalServerItems',
			enablePaging: false,
			rowHeight: 40,
			columnDefs: [
				{field: 'FIRSTNAME', displayName: 'First Name'},
				{field: 'LASTNAME', displayName: 'Last Name'},
				{field: 'EMAIL', displayName: 'Email'},
				{field: 'USERNAME', displayName: 'Username'},
				{field: 'ACTIONS', displayName:'', cellTemplate: actions, width: '111', sortable: false}
			]
		};

		$scope.deleteUser = function(userID) {
			$scope.userID = id;
			var modalInstance = $modal.open({
				templateUrl: 'views/deleteConfirm.htm',
				controller: userDeleteCtrl,
				resolve: {
					userID: function() { return id; }
				}
			});
			modalInstance.opened.then(function() {});
			modalInstance.result.then(function (action) {
				if(action === "refresh") {
					$scope.refreshUsers();
				}
			});
		};

		$scope.manageUser = function(row) {
			if(row == 0) {
				$scope.user = {
					userID: 0,
					isActive: true
				};
			} else {
				$scope.userID = row.getProperty('USERID');
				userService.get({id:$scope.userID}, function (resp) {
					if(angular.isDefined(resp.apiError)) {
						console.warn("API error when loading user");
					} else {
						$scope.user = resp;
						$scope.selectedRole = ($scope.userID != 0) ? $scope.user.role.roleID.toString() : 0;
					}
				});
			}
			$scope.userAddEdit = true;
		};

		$scope.changeUserPassword = function(id) {
			$scope.userID = id;
			var modalInstance = $modal.open({
				templateUrl: 'views/security/changePassword.htm',
				controller: adminChangeUserPasswordCtrl,
				resolve: {
					id: function() { return id; }
				}
			});
			modalInstance.opened.then(function() {});
			modalInstance.result.then(function (id) {});
		};

		$scope.resetMiniForm = function(more) {
			if(more == 0) {
				$scope.userAddEdit = false;
				$scope.user = {};
			} else if(more == 1) {
				$scope.user = {
					userID: 0
				};
			} else {
				return;
			}
		};

		$scope.saveUser = function(more) {
			if($scope.$$childHead.$$nextSibling.userForm.$dirty) {
				var data = $(userForm).serialize();
				userService.update({id: $scope.user.userID}, data, function (resp) {
					if(angular.isDefined(resp.apiError)) {
						console.warn("API error when saving user");
					} else {
						$scope.refreshUsers();
						($scope.user.userID == 0) ? flashService.show("New user added", "info") : flashService.show("User updated", "info");
						$scope.resetMiniForm(more);
					}
				});
			} else {
				$scope.resetMiniForm(more);
			}
		};
	});//END userCtrl


	app.controller('userDeleteCtrl', function ($scope, $modalInstance, userService, flashService, userID) {
		$scope.confirm = "Are you sure you want to delete this user?";
		$scope.delete = function() {
			userService.delete({id: userID}, function (resp) {
				if(angular.isDefined(resp.apiError)) {
					console.warn("API error when deleting user");
					var action = "noop";
				} else {
					flashService.show("User deleted");
					var action = "refresh";
				}
				$modalInstance.close(action);
			});
		};
	});//END

})();