(function () {
	'use strict';

	var app = angular.module('cbRestAngular');

	app.controller('permissionCtrl', function ($scope, $modal, permissionService, flashService) {
		$scope.refreshPermissions = function() {
			$scope.gettingPermissions = true;
			permissionService.query().$promise.then(function (resp) {
				$scope.gettingPermissions = false;
				if(angular.isDefined(resp.apiError)) {
					$scope.permissions = [];
					console.warn("API error when trying to load permissions");
				} else {
					$scope.permissions = resp;
					$scope.totalServerItems = ($scope.permissions.length) ? $scope.permissions[0].ITOTALRECORDS : 0;
				}
			});
		};
		$scope.refreshPermissions();

		$scope.permission = {
			permissionID: 0,
			permission: ''
		};

		$scope.sortInfo = {
			fields:['PERMISSION'],
			directions:['asc']
		};

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		var actions =
			'<div class="gridActions ngCellText" ng-class="col.colIndex()">' +
				'<a class="btn btn-mini" ng-if="checkPermission(\'PERMISSION_ADD/EDIT\')" ng-click="managePermission(row)" rel="tooltip" title="Edit">' +
					'<i class="icon-pencil icon-black"></i></a>' +
				'<a data-toggle="modal" ng-if="checkPermission(\'PERMISSION_ADMIN\')" ng-click="deletePermission(row.getProperty(\'PERMISSIONID\'))" class="btn btn-mini confirm-delete" rel="tooltip" title="Delete">' +
					'<i class="icon-trash icon-black"></i></a>' +
			'</div>';

		$scope.permissionsGrid = {
			data: 'permissions',
			showFooter: true,
			enableRowSelection: false,
			filterOptions: $scope.filterOptions,
			sortInfo: $scope.sortInfo,
			useExternalSorting: false,
			totalServerItems: 'totalServerItems',
			enablePaging: false,
			rowHeight: 40,
			columnDefs: [
				{field: 'PERMISSION', displayName: 'Permission'},
				{field: 'ACTIONS', displayName:'', cellTemplate: actions, width: '74', sortable: false}
			]
		};

		$scope.deletePermission = function(id) {
			var modalInstance = $modal.open({
				templateUrl: 'views/deleteConfirm.htm',
				backdrop: 'static',
				controller: permissionDeleteCtrl,
				resolve: {
					id: function() { return id; }
				}
			});
			modalInstance.opened.then(function() {});
			modalInstance.result.then(function (action) {
				if(action === "refresh") {
					$scope.refreshPermissions();
				}
			});
		};

		$scope.resetMiniForm = function() {
			$scope.newpermission = false;
			$scope.permission.permission='';
		};

		//modal for permission
		$scope.managePermission = function(row) {
			$scope.newpermission = true;
			if(row == 0) {
				$scope.permission = {
					permissionID: 0
				};
			} else {
				$scope.permission = {
					permissionID: row.getProperty('PERMISSIONID'),
					permission: row.getProperty('PERMISSION')
				};
			}
		};

		//save fxn for quick-add
		$scope.save = function() {
			var data = $(permissionForm).serialize();
			permissionService.update({id: $scope.permission.permissionID}, data, function(resp) {
				if(angular.isDefined(resp.apiError)) {
					console.warn("API error when saving permission");
				} else {
					$scope.refreshPermissions();
					$scope.resetMiniForm();
					($scope.permission.permissionID == 0) ? flashService.show("New permission added", "info") : flashService.show("Permission updated", "info");
				}
			});
		};
	});//END permissionCtrl


	app.controller('permissionDeleteCtrl', function ($scope, $modalInstance, permissionService, flashService, id) {
		$scope.confirm = "Are you sure you want to delete this permission?";
		$scope.delete = function() {
			permissionService.delete({id: id}, function (resp) {
				if(angular.isDefined(resp.apiError)) {
					console.warn("API error when deleting permission");
					var action = "noop";
				} else {
					flashService.show("Permission deleted", "info");
					var action = "refresh";
				}
				$modalInstance.close(action);
			});
		};
	});//END permissionDeleteCtrl

})();