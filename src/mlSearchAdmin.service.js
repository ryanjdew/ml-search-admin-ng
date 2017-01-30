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
