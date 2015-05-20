(function() {
	'use strict';

	var app = angular.module('cbRestAngular');

	app.controller('roleCtrl', function ($scope, $modal, roleService, permissionService, flashService, $timeout) {
		$scope.refreshRoles = function() {
			$scope.gettingRoles = true;
			roleService.query().$promise.then(function (resp) {
				$scope.gettingRoles = false;
				if(angular.isDefined(resp.apiError)) {
					$scope.roles = [];
					console.warn("API error when loading roles");
				} else {
					$scope.roles = resp;
				}
			});
		};
		$scope.refreshRoles();

		$scope.refreshPermissions = function() {
			permissionService.query().$promise.then(function (resp) {
				if(angular.isDefined(resp.apiError)) {
					$scope.permissions = [];
					console.warn("API error when loading permissions");
					return;
				} else {
					$scope.permissions = resp;
					$timeout(function() {
						$scope.showPermissions = true;
						$('#permissions').wl_Multiselect({
							onSelect: function (value) {
								value = parseInt(value);
								if($scope.selectedValues.indexOf(value) === -1) {
									$scope.selectedValues.push(value);
								}
							},
							onUnselect: function (value) {
								value = parseInt(value);
								if(angular.isDefined($scope.selectedValues)) {
									$scope.selectedValues.splice($scope.selectedValues.indexOf(value),1);
								}
							}
						});
					});
				}
			});
		};
		$scope.refreshPermissions();

		$scope.sortInfo = {
			fields:['ROLE'],
			directions:['asc']
		};

		$scope.filterOptions = {
			filterText: "",
			useExternalFilter: false
		};

		$scope.totalServerItems = 0;

		var actions =
			'<div class="gridActions ngCellText" ng-class="col.colIndex()">' +
				'<a class="btn btn-mini" ng-if="checkPermission(\'ROLE_ADD/EDIT\')" ng-click="manageRole(row)" rel="tooltip" title="Edit">' +
					'<i class="icon-pencil icon-black"></i></a>' +
				'<a data-toggle="modal" ng-if="checkPermission(\'ROLE_ADMIN\')" ng-click="deleteRole(row.getProperty(\'ROLEID\'))" class="btn btn-mini confirm-delete" rel="tooltip" title="Delete">' +
					'<i class="icon-trash icon-black"></i></a>' +
			'</div>';

		$scope.roleGrid = {
			data: 'roles',
			showFooter: true,
			enableRowSelection: false,
			filterOptions: $scope.filterOptions,
			sortInfo: $scope.sortInfo,
			useExternalSorting: false,
			totalServerItems: 'totalServerItems',
			enablePaging: false,
			rowHeight: 40,
			columnDefs: [
				{field: 'ROLE', displayName: 'Role'},
				{field: 'DESCRIPTION', displayName: 'Description'},
				{field: 'ACTIONS', displayName:'', cellTemplate: actions, width: '74', sortable: false}
			]
		};

		$scope.deleteRole = function(id) {
			var modalInstance = $modal.open({
				templateUrl: 'views/deleteConfirm.htm',
				controller: roleDeleteCtrl,
				resolve: {
					roleID: function() { return id; }
				}
			});
			modalInstance.opened.then(function() {});
			modalInstance.result.then(function (action) {
				if(action === "refresh") {
					$scope.refreshRoles();
				}
			});
		};

		$scope.manageRole = function(row) {
			$('#permissions').wl_Multiselect('clear');

			//check where the combo is
			var multiSelectOptions = [];
			$('ul.comboselect:first').children('li').each(function(index) {
				var selectOption = {
					id:index,
					name:$(this).text()
				};
				multiSelectOptions.push(selectOption);
			});
			$scope.multiSelectOptions = multiSelectOptions;

			if(row == 0) {
				$scope.role = {
					roleID: 0
				};
				$scope.selectedValues = [];
			} else {
				$scope.roleID = row.getProperty('ROLEID');
				roleService.get({id:$scope.roleID}, function (resp) {
					if(angular.isDefined(resp.apiError)) {
						console.warn("API error when loading role");
					} else {
						$scope.role = resp;
						if($scope.role.permissions.length) {
							var permissions = $scope.role.permissions.sort(function (a,b) {
								return (a.permissionID > b.permissionID) ? 1 : (a.permissionID < b.permissionID) ? -1 : 0;
							});
							if(!angular.isUndefined(permissions)) {
								if(permissions === null) {
									$scope.selectedValues = [];
								} else {
									$scope.selectedValues = [];
									angular.forEach(permissions, function (value, key) {
										var permission = value.permission;
										angular.forEach($scope.multiSelectOptions, function (value, key) {
											if(value.name === permission) {
												$scope.selectedValues.push(value.id);
											}
										});
									});
								}
							}
						} else {
							$scope.selectedValues = [];
						}
						$('#permissions').wl_Multiselect('select',$scope.selectedValues);
					}
				});
			}
			$scope.roleAddEdit = true;
		};

		$scope.resetMiniForm = function(more) {
			if(more == 0) {
				$scope.roleAddEdit = false;
				$scope.role = {};
				$('#permissions').wl_Multiselect('clear');
			} else if(more == 1) {
				$scope.role = {
					roledID: 0
				};
				$('#permissions').wl_Multiselect('clear');
			} else {
				return;
			}
		};

		$scope.saveRole = function(more) {
			var data = $(roleForm).serialize().split('&permissions')[0].split('role=')[1];
			var processedValues = [];
			//raise the permissionIDs up 1 for CF processing
			angular.forEach($scope.selectedValues, function(val) {
				val = ++val;
				processedValues.push(val);
			});
			var processedData = '&role=' + data + "&permissions=" + processedValues;
			roleService.update({id: $scope.role.roleID}, processedData, function (resp) {
				if(angular.isDefined(resp.apiError)) {
					console.warn("API error when saving role");
				} else {
					$scope.refreshRoles();
					($scope.role.roleID == 0) ? flashService.show("New role added", "info") : flashService.show("Role updated", "info");
					$scope.resetMiniForm(more);
				}
			});
		};
	});//END roleCtrl


	app.controller('roleDeleteCtrl', function ($scope, $modalInstance, roleService, flashService, roleID) {
		$scope.confirm = "Are you sure you want to delete this role?";
		$scope.delete = function() {
			roleService.delete({id: roleID}, function (resp) {
				if(angular.isDefined(resp.apiError)) {
					console.warn("API error when deleting role");
					var action = "noop";
				} else {
					flashService.show("Role deleted");
					var action = "refresh";
				}
				$modalInstance.close(action);
			});
		};
	});//END roleDeleteCtrl

})();