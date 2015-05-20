(function() {
	'use strict';

	var app = angular.module('cbRestAngular');

	//AUTO-FOCUS
	app.directive('ckhAutoFocus', function() {
		return {
			restrict: 'A',
			link: function(scope, elem, attrs) {
				elem.focus();
			}
		};
	});


	//FORM-SUBMIT-ENTER
	app.directive('ckhFormSubmitEnter', function() {
		return {
			restrict: 'A',
			link: function(scope, elem, attrs) {
				elem.keypress(function (e) {
					if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
						elem.find('button').not('.ng-hide').not(":contains('Cancel')").click();
					}
				});
			}
		};
	});


	//MAKSERADE DATE-MASK
	app.directive('ckhMaskerade', function($parse) {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function(scope, elem, attrs, ctrl) {
				elem.maskerade({mask:attrs.ckhMaskerade});
				var modelValue = scope.ngModel;
				if(modelValue !== '' && modelValue !== undefined) {
					elem.val(modelValue);
				}
				elem.blur(function () {
					if(ctrl.$viewValue !== '' && elem.val() === '') {
						elem.val(ctrl.$viewValue);
						scope.ngModel = elem.val();
						elem.removeClass('ng-pristine ng-invalid ng-invalid-required').addClass('ng-dirty ng-valid ng-valid-required');
						scope.$apply(function(){
							ctrl.$setValidity('required', true);
						});
					}
					if(ctrl.$viewValue !== '' && elem.val() !== '') {
						scope.ngModel = elem.val();
						elem.removeClass('ng-pristine ng-invalid ng-invalid-required').addClass('ng-dirty ng-valid ng-valid-required');
						scope.$apply(function(){
							ctrl.$setValidity('required', true);
						});
					}
				});
			}
		};
	});


	//NOEMAIL
	app.directive('ckhNoEmail', function($timeout) {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function (scope, elem, attrs, ctrl) {
				//original state
				angular.element(document).ready(function() {
					$timeout(function() {
						if($('#noEmail').prop('checked') == true) {//noEmail = true
							elem.removeClass('required ng-invalid ng-invalid-required').addClass('ng-valid').removeAttr('required');
							elem.val('');
							scope.$apply(function(){ ctrl.$setValidity('required', true); });
						}
						if($('#noEmail').prop('checked') == false) {//noEmail = false
							elem.addClass('required').prop('required',true);
							if(elem.val() === '') {
								elem.removeClass('ng-valid ng-valid-required').addClass('ng-invalid ng-invalid-required');
								scope.$apply(function(){ ctrl.$setValidity('required', false); });
							}
						}
					},100);
				});

				//on clicking the checkbox
				$('#noEmail').on('click', function() {
					if($(this).prop('checked') == true) {//noEmail = true
						elem.removeClass('required ng-invalid ng-invalid-required').addClass('ng-valid').removeAttr('required');
						elem.val('');
						scope.$apply(function(){ ctrl.$setValidity('required', true); });
					}
					if($(this).prop('checked') == false) {//noEmail = false
						elem.addClass('required').prop('required',true);
						if(elem.val() === '') {
							elem.removeClass('ng-valid ng-valid-required').addClass('ng-invalid ng-invalid-required');
							scope.$apply(function(){ ctrl.$setValidity('required', false); });
						}
					}
				});

				elem.keyup(function() {
					if($('#noEmail').prop('checked') == true) {
						$('#noEmail').prop('checked', false);
						elem.removeClass('ng-valid ng-valid-required').addClass('ng-invalid ng-invalid-required');
						scope.$apply(function(){ ctrl.$setValidity('required', false); });
					}
				});
			}
		};
	});


	//auto-caplitalization directive
	app.directive('ckhAutoCap', function() {
		return {
			restrict: 'A',
			link: function(scope, elem, attrs) {
				elem.keyup(function() { var val = $(this).val(); $(this).val(val.toUpperCase()); });
			}
		};
	});

})();