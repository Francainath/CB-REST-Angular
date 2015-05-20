(function() {
	'use strict';

	var app = angular.module('cbRestAccount', []);

	app.controller('accountEntryCtrl', ['$scope', '$modal', 'userService', 'flashService', 'authenticationService', accountEntryCtrl]);

	function accountEntryCtrl($scope, $modal, userService, flashService, authenticationService) {
		$scope.user = authenticationService.getUser();

		$scope.changePassword = function(id) {
			var modalInstance = $modal.open({
				templateUrl: 'views/security/changePassword.htm',
				backdrop: 'static',
				controller: changePasswordCtrl,
				resolve: {
					id: function() { return id; }
				}
			});
			modalInstance.opened.then(function() {});
			modalInstance.result.then(function () {});
		};

		$scope.save = function() {
			if($scope.accountEditForm.$dirty) {
				var userID = $scope.user.userID;
				var userData = $(accountEditForm).serialize();
				userData += "&isActive=true";
				$scope.updatingUser = true;
				userService.update({id: userID}, userData, function success(resp) {
					$scope.updatingUser = false;
					if(angular.isDefined(resp.apiError)) {
						console.warn("API error when updating user");
					} else {
						flashService.show("Account information has been updated.");
						authenticationService.setUser(userID);
					}
				});
			} else {
				flashService.show("No changes on form detected", "warning");
			}
		};
	}//END accountEntryCtrl

})();