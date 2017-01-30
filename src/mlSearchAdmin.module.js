(function () {
  'use strict';

  angular.module('ml.searchAdmin',
    [
      'ml.common','ml.searchAdmin.tpls',
      'ml.search','ui.bootstrap'
    ])
    .filter('decodeString', function() {
      return function(input) {
        try {
          return decodeURIComponent(input);
        } catch (e) {
          return {};
        }
      };
    })
    .directive('encodedValue', function() {
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModelController) {
          ngModelController.$parsers.push(function(data) {
            //convert data from view format to model format
            return encodeURIComponent(data); //converted
          });

          ngModelController.$formatters.push(function(data) {
            //convert data from model format to view format
            return decodeURIComponent(data); //converted
          });
        }
      };
    });

}());
