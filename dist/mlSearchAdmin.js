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

(function() {
  'use strict';

  var module = angular.module('ml.searchAdmin');

  /**
   * @ngdoc controller
   * @kind constructor
   * @name EditConstraintCtrl
   * @description
   */
  module.controller('EditConstraintCtrl', [
    '$uibModalInstance', '$scope', 'ServerConfig',
    'rangeIndexes', 'constraint', 'constraintType',
    function ($uibModalInstance, $scope, ServerConfig, rangeIndexes, constraint, constraintType) {
      $scope.constraintTypes = _.filter(Object.keys(constraint), function(val) {
            return val !== 'name' && val !== 'annotation' && constraint.hasOwnProperty(val);
          });
      $scope.rangeConstraintType = 'raw';
      $scope.rangeIndexes = [];
      angular.forEach(rangeIndexes, function(val) {
        var rootKey = Object.keys(val)[0];
        var copy = angular.copy(val[rootKey]);
        copy.$label =
          (copy['parent-localname'] ? copy['parent-localname'] + ' ' : '') +
          (copy.localname || copy['field-name'] || copy['path-index']);
        $scope.rangeIndexes.push(copy);
      });
      $scope.dataTypes = ServerConfig.dataTypes();
      $scope.constraintType = constraintType || 'collection';
      $scope.constraint = constraint;

      $scope.defaultRangeSettings = {
            'facet': true,
            'facet-option': [
                  'limit=10',
                  'frequency-order',
                  'descending'
                ]
          };

      function resetRangeConstraint() {
        $scope.constraint.range = {
          'facet':  $scope.constraint.range.facet || $scope.defaultRangeSettings.facet,
          'facet-option':
            $scope.constraint.range['facet-option'] || $scope.defaultRangeSettings['facet-option']
        };
      }

      if ($scope.constraintType === 'range' && $scope.constraint.range) {
        var rangeConstraint = $scope.constraint.range;
        $scope.selectedRangeIndex = _.filter($scope.rangeIndexes, function(val) {
          var matchedSelector = false;
          if (val['parent-localname'] && rangeConstraint.element) {
            matchedSelector = val['parent-localname'] === rangeConstraint.element.name;
          }
          if (val.localname && rangeConstraint.element && !rangeConstraint.attribute) {
            matchedSelector = val.localname === rangeConstraint.element.name;
          }
          if (val.localname && rangeConstraint.attribute) {
            matchedSelector = val.localname === rangeConstraint.attribute.name;
          }
          if (val['field-name'] && rangeConstraint.field) {
            matchedSelector = val['field-name'] === rangeConstraint.field.name;
          }
          if (val['path-index'] && rangeConstraint['path-index']) {
            matchedSelector = val['path-index'] === rangeConstraint['path-index'];
          }
          return 'xs:' + val['scalar-type'] === $scope.constraint.range.type &&
           (val.collation === $scope.constraint.range.collation ||
            !(val.collation || $scope.constraint.range.collation)) &&
           matchedSelector;
        })[0];
        var computedBucket = rangeConstraint['computed-bucket'];
        var bucket = rangeConstraint.bucket;
        resetRangeConstraint();
        $scope['computed-bucket'] = computedBucket;
        $scope.constraint.range.bucket = bucket;
        if (bucket) {
          $scope.rangeConstraintType = 'bucket';
        } else if (computedBucket) {
          $scope.rangeConstraintType = 'computed-bucket';
        }
      }

      $scope.$watch(function() { return $scope.rangeConstraintType;}, function() {
        resetRangeConstraint();
        if ($scope.rangeConstraintType && $scope.rangeConstraintType !== 'raw') {
          $scope.constraint.range[$scope.rangeConstraintType] = [];
        }
      });

      $scope.save = function () {
        var newConstraint = {
          name: $scope.constraint.name,
          annotation: $scope.constraint.annotation
        };
        var constraintDetails = $scope.constraint[$scope.constraintType];
        if (constraintDetails.field && !constraintDetails.field.name) {
          delete constraintDetails.field;
        }
        if (constraintDetails.attribute && !constraintDetails.attribute.name) {
          delete constraintDetails.attribute;
        }
        if (!constraintDetails['json-property'] || constraintDetails['json-property'] === '') {
          delete constraintDetails['json-property'];
        }
        if (!constraintDetails['path-index'] || constraintDetails['path-index'] === '') {
          delete constraintDetails['path-index'];
        }
        if (constraintDetails.bucket && !constraintDetails.bucket.length) {
          delete constraintDetails.bucket;
        }
        if (constraintDetails['computed-bucket'] && !constraintDetails['computed-bucket'].length) {
          delete constraintDetails['computed-bucket'];
        }
        if (constraintDetails.collation || constraintDetails.type !== 'xs:string') {
          delete constraintDetails.collation;
        }
        angular.forEach(constraintDetails, function(val, key) {
          if (/^\$/.test(key)) {
            delete constraintDetails[key];
          }
        });
        newConstraint[$scope.constraintType] = constraintDetails;
        if ($scope.constraintType === 'range') {
          var rangeIndex = $scope.selectedRangeIndex;
          var rangeConstraint = newConstraint[$scope.constraintType];
          rangeConstraint.type = 'xs:' + rangeIndex['scalar-type'];
          rangeConstraint.collation = rangeIndex.collation;
          if (rangeIndex.localname) {
            rangeConstraint.element = {
              'name': (rangeIndex['parent-localname'] || rangeIndex.localname),
              'ns': (rangeIndex['parent-namespace-uri'] || rangeIndex['namespace-uri'])
            };
          }
          if (rangeIndex['parent-localname']) {
            rangeConstraint.attribute = {
              'name': rangeIndex.localname,
              'ns': rangeIndex['namespace-uri']
            };
          }
          if (rangeIndex['field-name']) {
            rangeConstraint.field = {
              'name': rangeIndex['field-name'],
              'collation': rangeIndex.collation
            };
          }
        }
        $uibModalInstance.close(newConstraint);
      };
    }]);

  /**
   * @ngdoc dialog
   * @name EditConstraintDialog
   * @kind function
   * @description A UI Bootstrap component that provides a modal dialog for
   * adding a constraint to the application.
   */
  module.factory('EditConstraintDialog', [
    '$uibModal',
    function ($uibModal) {
      return function (rangeIndexes, constraint) {
        var modalConstraint = angular.extend({}, {
                  'name': '',
                  'annotation': '',
                  'range': {},
                  'value': {
                    'type': null,
                    'element': {
                      'ns': '',
                      'name': ''
                    },
                    'attribute': {
                      'ns': '',
                      'name': ''
                    },
                    'json-property': '',
                    'field': {'name': ''},
                    'fragment-scope': 'documents',
                    'term-option': []
                  },
                  'collection': {
                    'prefix': '',
                    'facet-option': [],
                    'facet': false
                  },
                  'custom': {
                    'facet': false,
                    'parse': {
                      'apply': '',
                      'ns': '',
                      'at': ''
                    },
                    'start-facet': {
                      'apply': '',
                      'ns': '',
                      'at': ''
                    },
                    'finish-facet': {
                      'apply': '',
                      'ns': '',
                      'at': ''
                    },
                    'facet-option': [],
                    'term-option': []
                  }
                }, constraint || {});
        var constraintType =
          angular.isObject(constraint) ? _.filter(Object.keys(constraint), function(val) {
            return val !== 'name' && val !== 'annotation' && constraint.hasOwnProperty(val);
          })[0] : null;
        return $uibModal.open({
            templateUrl: '/ml-search-admin/templates/editConstraint.html',
            controller: 'EditConstraintCtrl',
            size: 'lg',
            resolve: {
              rangeIndexes: function() {
                return rangeIndexes;
              },
              constraint: function() {
                return modalConstraint;
              },
              constraintType: function() {
                return constraintType || 'collection';
              }
            }
          }).result;
      };
    }
  ]);

}());

(function() {

  'use strict';

  angular.module('ml.searchAdmin')
    .directive('constraintForm', [function() {
    function link(scope, element, attrs) {
      scope.type = function(val) {
        if (scope.constraintPropertyName === 'bucket' ||
            scope.constraintPropertyName === 'computed-bucket') {
          return scope.constraintPropertyName;
        } else if (val === true || val === false) {
          return 'boolean';
        } else if (angular.isArray(val)) {
          return 'array';
        } else if (angular.isObject(val)) {
          return 'object';
        } else {
          return 'string';
        }
      };
    }
    // directive factory creates a link function
    return {
      restrict: 'E',
      templateUrl: '/ml-search-admin/templates/constraint-form.html',
      scope: {
        'constraintObject': '=',
        'constraintPropertyName': '=',
        'constraintProperty': '='
      },
      link: link
    };
  }]);
}());
(function() {

  'use strict';

  /**
   * angular element directive; a constraint editor based off of MarkLogic search options.
   *
   * attributes:
   *
   * - `constraints`: existiing constraints
   * - `existing-indexes`: optional. Indexes in the database.
   * - `options-name`: optional. Names of the search options
   *
   * Example:
   *
   * ```
   * <ml-constraints constraints="model.constraints" existing-indexes="existingIndexes" options-name="'all'"></ml-constraints>```
   *
   * @namespace ml-constraints
   */
  angular.module('ml.searchAdmin')
    .directive('mlConstraints', ['EditConstraintDialog', 'SearchAdmin',
      function(EditConstraintDialog, SearchAdmin) {
        function moveArrayItem(array, oldIndex, newIndex) {
          while (oldIndex < 0) {
            oldIndex += array.length;
          }
          while (newIndex < 0) {
            newIndex += array.length;
          }
          if (newIndex >= array.length) {
            var k = newIndex - array.length;
            while ((k--) + 1) {
              array.push(undefined);
            }
          }
          array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
          return array; // for testing purposes
        }

        function link(scope, element, attrs) {
          scope.optionsName = scope.optionsName || 'all';

          scope.resampleConstraints = function() {
            scope.constraints = SearchAdmin
              .resampleConstraints(scope.constraints, scope.existingIndexes);
          };

          scope.addConstraint = function() {
            new EditConstraintDialog(scope.existingIndexes['range-index-list'])
              .then(function(constraint) {
              scope.constraints.push(constraint);
            });
          };

          scope.editConstraint = function(index) {
            new EditConstraintDialog(
              scope.existingIndexes['range-index-list'],
              scope.constraints[index]
            )
            .then(function(constraint) {
              scope.constraints[index] = constraint;
            });
          };

          scope.removeConstraint = function(index) {
            scope.constraints.splice(index, 1);
          };

          scope.reorderConstraint = function(index, newIndex) {
            moveArrayItem(scope.constraints, index, newIndex);
          };

          scope.submitConstraints = function() {
            return SearchAdmin.setSearchOptions(
              scope.optionsName,
              { options: { constraint: scope.constraints } },
              'constraint'
            );
          };
        }

        return {
          restrict: 'E',
          templateUrl: '/ml-search-admin/templates/ml-constraints.html',
          scope: {
            'constraints': '=?',
            'existingIndexes': '=?',
            'optionsName': '=?'
          },
          link: link
        };
      }]);
})();

(function() {

  'use strict';

  /**
   * angular element directive; a constraint editor based off of MarkLogic search options.
   *
   * attributes:
   *
   * - `constraints`: existiing constraints
   * - `existing-indexes`: optional. Indexes in the database.
   * - `options-name`: optional. Names of the search options
   *
   * Example:
   *
   * ```
   * <ml-sort-options constraints="model.constraints" existing-indexes="existingIndexes" options-name="'all'"></ml-sort-options>```
   *
   * @namespace ml-sort-options
   */
  angular.module('ml.searchAdmin')
    .directive('mlSortOptions', ['SearchAdmin',
      function(SearchAdmin) {

        function link(scope, element, attrs) {
          var model = {};
          model.newSortOptionDirection = 'ascending';
          scope.model = model;

          scope.optionsName = scope.optionsName || 'all';

          scope.addSortOption = function() {
            if (model.newSortOptionName && model.newSortOptionRange) {
              var selectedRange = model.newSortOptionRange.range;
              scope.sortOptions.state.push({
                name: encodeURIComponent(model.newSortOptionName),
                'sort-order': [
                  {
                    direction: model.newSortOptionDirection,
                    element: selectedRange.element,
                    attribute: selectedRange.attribute,
                    field: selectedRange.field,
                    'json-property': selectedRange['json-property']
                  }
                ]
              });
            }
          };

          scope.removeSortOption = function(index) {
            scope.sortOptions.state.splice(index, 1);
          };

          scope.saveSortOptions = function() {
            return SearchAdmin.setSearchOptions(
              scope.optionsName,
              { options: { operator: scope.sortOptions } },
              'operator'
            );
          };
        }

        return {
          restrict: 'E',
          templateUrl: '/ml-search-admin/templates/ml-sort-options.html',
          scope: {
            'constraints': '=?',
            'sortOptions': '=?',
            'optionsName': '=?'
          },
          link: link
        };
      }]);
})();

(function() {

  'use strict';

  /**
   * angular element directive; a constraint editor based off of MarkLogic search options.
   *
   * attributes:
   *
   * - `constraints`: existiing constraints
   * - `existing-indexes`: optional. Indexes in the database.
   * - `options-name`: optional. Names of the search options
   *
   * Example:
   *
   * ```
   * <ml-suggest-options constraints="model.constraints" existing-indexes="existingIndexes" options-name="'all'"></ml-suggest-options>```
   *
   * @namespace ml-suggest-options
   */
  angular.module('ml.searchAdmin')
    .directive('mlSuggestOptions', ['SearchAdmin',
      function(SearchAdmin) {

        function constructDefaultSourceOptions(inContraints, inDefaultSource) {
          var options = [];
          angular.forEach(inContraints, function(val) {
            if (val.range && val.range.type === 'xs:string') {
              var option = {
                name: val.name,
                value: val.name
              };
              options.push(option);
            }
          });
          return options;
        }

        function convertToOption(inDefaultSource) {
          var result = [];
          if (inDefaultSource && inDefaultSource) {
            var ref = inDefaultSource.ref;
            result.push(ref);
          }
          return result.join('|');
        }

        function link(scope, element, attrs) {
          var model = {
            defaultSource: convertToOption(scope.defaultSource)
          };
          scope.model = model;
          scope.optionsName = scope.optionsName || 'all';
          scope.saveDefaultSource = function() {
            var chosenOption = model.defaultSource;
            var defaultSuggestOptions =
              {
                options:
                  { 'default-suggestion-source': {
                      'ref': chosenOption
                    }
                  }
              };

            SearchAdmin
              .setSearchOptions(
                scope.optionsName,
                defaultSuggestOptions,
                'default-suggestion-source'
              );

            var suggestOptions = { options: { 'suggestion-source': [] } };
            suggestOptions.options['suggestion-source'] = [];
            angular.forEach(scope.constraints, function(constraint) {
              if (constraint.range && constraint.range.type === 'xs:string') {
                suggestOptions.options['suggestion-source']
                  .push({ ref: constraint.name });
              }
            });

            SearchAdmin
              .setSearchOptions(
                scope.optionsName,
                suggestOptions,
                'suggestion-source'
              );
          };

          scope.getDefaultSourceOpts = function() {
            model.suggestOptions = constructDefaultSourceOptions(
              scope.constraints,
              scope.defaultSource
            );
          };

          scope.$watch(
            function() {
              return scope.constraints;
            },
            function(newVal) {
              if (newVal) {
                scope.getDefaultSourceOpts();
              }
            }
          );

        }

        return {
          restrict: 'E',
          templateUrl: '/ml-search-admin/templates/ml-suggest-options.html',
          scope: {
            'constraints': '=?',
            'sortOptions': '=?',
            'defaultSource': '=?',
            'optionsName': '=?'
          },
          link: link
        };
      }]);
})();

(function() {
  'use strict';

  angular.module('ml.searchAdmin')
    .factory('SearchAdmin', [
      '$http', '$q',
    function($http, $q) {
      var SearchAdmin = {};
      SearchAdmin.getSearchOptions = function(optionsName, elementName) {
        var postFix = '';
        if (elementName) {
          postFix = '/' + elementName;
        }
        optionsName = optionsName || 'all';
        return $http.get('/v1/config/query/' + optionsName + postFix)
          .then(function(response) {
              return response.data;
            },
            $q.reject);
      };

      SearchAdmin.setSearchOptions = function(optionsName, searchOptions, elementName) {
        var postFix = '';
        if (elementName) {
          postFix = '/' + elementName;
        }
        optionsName = optionsName || 'all';
        return $http.put('/v1/config/query/' + optionsName + postFix, searchOptions)
          .then(function(response) {
              return response.data;
            },
            $q.reject);
      };

      SearchAdmin.resampleConstraints = function(constraints, existingIndexes) {
        constraints = constraints || [];
        function constraintExists(constraint) {
          var compareConstraint = angular.copy(constraint);
          delete compareConstraint.name;
          return _.some(constraints, function(existingConstraint) {
            var existingCompareConstraint = angular.copy(existingConstraint);
            delete existingCompareConstraint.name;
            return angular.equals(existingCompareConstraint, compareConstraint);
          });
        }
        angular.forEach(existingIndexes['range-index-list'], function(val) {
          var value = val['range-element-index'] ||
            val['range-element-attribute-index'] ||
            val['range-field-index'] ||
            val['range-path-index'];
          var name = value.localname || value['field-name'] || value['path-expression'];
          if (name && name !== '') {
            var constraint = {
              'name': name,
              'range': {
                'type': 'xs:' + value['scalar-type'],
                'facet': true,
                'facet-option': [
                  'limit=10',
                  'frequency-order',
                  'descending'
                ],
                'collation': value.collation
              }
            };
            if (value.localname) {
              constraint.range.element = {
                'name': (value['parent-localname'] || value.localname),
                'ns': (value['parent-namespace-uri'] || value['namespace-uri'])
              };
            }
            if (value['parent-localname']) {
              constraint.range.attribute = {
                'name': value.localname,
                'ns': value['namespace-uri']
              };
            }
            if (value['field-name']) {
              constraint.range.field = {
                'name': value['field-name'],
                'collation': value.collation
              };
            }
            if (!constraintExists(constraint)) {
              constraints.push(constraint);
            }
          }
        });
        angular.forEach(existingIndexes['geospatial-index-list'], function(val) {
          var indexType = Object.keys(val)[0];
          var value = val[indexType];
          var constraint;
          var geoObj = {
            heatmap: {
              s: -85,
              w: -180,
              n: 85,
              e: 180,
              latdivs: 50,
              londivs: 50
            }
          };
          if (indexType === 'geospatial-element-index') {
            constraint = {
              name: value.localname,
              'geo-elem': geoObj
            };
            geoObj.element = {
              ns: value['namespace-uri'],
              name: value.localname
            };
          } else if (indexType === 'geospatial-element-pair-index') {
            constraint = {
              name: value['latitude-localname'] + ' ' + value['longitude-localname'],
              'geo-elem-pair': geoObj
            };
            geoObj.parent = {
              ns: value['parent-namespace-uri'],
              name: value['parent-localname']
            };
            geoObj.lat = {
              ns: value['latitude-namespace-uri'],
              name: value['latitude-localname']
            };
            geoObj.lon = {
              ns: value['longitude-namespace-uri'],
              name: value['longitude-localname']
            };
          } else if (indexType === 'geospatial-element-attribute-pair-index') {
            constraint = {
              name: value['latitude-localname'] + ' ' + value['longitude-localname'],
              'geo-attr-pair': geoObj
            };
            geoObj.parent = {
              ns: value['parent-namespace-uri'],
              name: value['parent-localname']
            };
            geoObj.lat = {
              ns: value['latitude-namespace-uri'],
              name: value['latitude-localname']
            };
            geoObj.lon = {
              ns: value['longitude-namespace-uri'],
              name: value['longitude-localname']
            };
          } else if (indexType === 'geospatial-path-index') {
            constraint = {
              name: value['path-index'],
              'geo-path': geoObj
            };
            geoObj['path-index'] = value['path-index'];
          }
          if (constraint && !constraintExists(constraint)) {
            constraints.push(constraint);
          }
        });
        angular.forEach(existingIndexes['field-list'], function(value) {
          if (value['field-name'] && value['field-name'] !== '') {
            var constraint = {
              'name': value['field-name'],
              'word': {
                'field': {
                  'name': value['field-name'],
                  'collation': value.collation
                }
              }
            };
            if (constraint && !constraintExists(constraint)) {
              constraints.push(constraint);
            }
          }
        });
        return constraints;
      };

      SearchAdmin.getSortOptions = function(optionsName, existingIndexes) {
        return SearchAdmin.getSearchOptions(optionsName).then(function(data) {
          if (!data.options.operator) {
            return [];
          } else {
            return _.filter(
              data.options.operator,
              function(val) {
                return val.name === 'sort';
              }
            )[0];
          }
        });
      };

      return SearchAdmin;
    }]);
})();
