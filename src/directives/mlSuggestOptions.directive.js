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
              ).then(function(result) {
              if (scope.saveCallback) {
                scope.saveCallback();
              }
              return result;
            });
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
            'optionsName': '=?',
            'saveCallback': '&?'
          },
          link: link
        };
      }]);
})();
