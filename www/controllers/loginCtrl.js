(function() {
	'use strict';

	var app = angular.module('cbRestAngular');

	app.controller('loginController', function ($scope, $rootScope, $location, $modal, authenticationService, $timeout, $cookieStore, flashService) {
		$scope.credentials = { username: "", password: "" };

		$scope.login = function() {
			if(!$scope.credentials.username.length) {
				$scope.credentials.username = $('#username').val();
				$scope.credentials.password = $('#password').val();
			}

			$scope.doingLogin = true;
			authenticationService.login($scope.credentials).success(function (data) {
				$scope.doingLogin = false;
				if(data.RESULT === true) {
					$rootScope.loggedInUser = data.USER;
					console.clear();
					console.info("Login was successful. You have successfully logged in", data.USER.firstName, data.USER.lastName);
					$timeout(function() { $location.path('/'); }, 250);

				} else if(data.RESULT === false) {
					console.error("Login unsuccessful. Credentials did not match.");
					flashService.show('Wrong credentials. Please try again.',"error");
					$scope.credentials.password = '';
				}
			});
		};

		$scope.doForgotPassword = function() {
			$modal.open({
				templateUrl: 'views/security/forgotPassword.htm',
				backdrop: 'static',
				controller: forgotPasswordCtrl,
				resolve: {}
			});
		};
	});//END loginController

	app.controller('forgotPasswordCtrl', function ($scope, $modalInstance, authenticationService, flashService) {
		$scope.processedTemporaryPassword = false;

		$scope.generateTemporaryPassword = function() {
			var data = "userEmail=" + $("#userEmail").val();
			authenticationService.generateTemporaryPassword(data).success(function() {
				$scope.processedTemporaryPassword = true;
			});
		};
	});//END forgotPasswordCtrl


	app.controller('logoutController', function ($scope, $location, authenticationService, flashService) {
		authenticationService.logout();
		simpleStorage.flush();
		$location.path('/login');
		flashService.show('You are now logged out',"warning");
	});//END logoutController


	app.controller('changePasswordCtrl', function ($scope, $modalInstance, $location, authenticationService, flashService, id) {
		$scope.user = authenticationService.getUser({id:id});
		$scope.username = (!angular.equals({}, $scope.user)) ? $scope.user.username : '';
		$scope.credentials = { username: $scope.username, currentpassword: "", newpassword: "", confirmpassword: "" };

		$scope.changePassword = function() {
			authenticationService.changePassword($scope.credentials).$promise.then(function (data) {
				if(data.RESULT === true) {
					console.info("Password succesfully updated.");
					flashService.show('You have succesfully changed your password. Please log back in with your new credentials',"info");
					$modalInstance.close();
					$location.path('/logout');
				} else if(data.RESULT === false) {
					console.error(data.MESSAGE);
					flashService.show('Something went wrong with your password change',"error");
					$scope.notRight = true;
					$scope.notAuthenticated = data.MESSAGE;
					$scope.credentials.currentpassword = '';
					$scope.credentials.newpassword = '';
					$scope.credentials.confirmpassword = '';
				}
			});
		};
	});// END changePasswordController


	app.controller('adminChangeUserPasswordCtrl', function ($scope, $modalInstance, userService, authenticationService, flashService, id) {
		$scope.adminChangePassword = true;
		$scope.user = userService.get({id:id}).$promise.then(function() {
			$scope.username = (!angular.equals({}, $scope.user)) ? $scope.user.username : "";
			$scope.credentials = { username: $scope.username, newpassword: "", confirmpassword: "" };
		});

		$scope.changePassword = function() {
			$scope.credentials.adminChangePassword = true;
			authenticationService.adminChangePassword($scope.credentials).$promise.then(function (data) {
				if(data.RESULT === true) {
					console.info("Password successfully updated.");
					flashService.show("You have succesfully changed this user's password","info");
					$modalInstance.close();
				} else if(data.RESULT === false) {
					flashService.show("Something went wrong with this user's password change!","error");
					console.error(data.MESSAGE);
					$modalInstance.close();
				}
			});
		};
	});//END

})();