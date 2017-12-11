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
            ).then(function(result) {
              if (scope.saveCallback) {
                scope.saveCallback();
              }
              return result;
            });
          };
        }

        return {
          restrict: 'E',
          templateUrl: '/ml-search-admin/templates/ml-constraints.html',
          scope: {
            'constraints': '=?',
            'existingIndexes': '=?',
            'optionsName': '=?',
            'saveCallback': '&?'
          },
          link: link
        };
      }]);
})();
