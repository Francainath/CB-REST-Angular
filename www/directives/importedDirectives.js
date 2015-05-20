(function() {
	'use strict';

	var app = angular.module('cbRestAngular');

	//CHOSEN
	app.directive('chosen', function() {
		var linker = function (scope, element, attrs) {
			var list = attrs['chosen'];
			scope.$watch(list, function () {
				element.trigger('chosen:updated');
			});

			scope.$watch(attrs['ngModel'], function() {
				element.trigger('chosen:updated');
				for(var i in scope[list]){
					if(element.val() == scope[list][i]) {
						scope[attrs['ngModel']] = i;
						break;
					}
				}
			});
			element.chosen({ width: '100%'});
		};

		return {
			restrict: 'A',
			link: linker
		};
	});
})();