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
