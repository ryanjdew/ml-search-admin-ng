# ml-search-admin-ng
AngularJS library for working with MarkLogic's Search Options Configuration

#### getting started

    bower install ml-search-admin-ng --save

#### services

- `SearchAdmin`: Service for working with search options configuration.

#### directives

- `ml-constraints`: Lists constraints and allows them to be edited or new ones to be added to.

- `ml-sort-options`: Lists sort options and allows them to be added to or removed from.

- `ml-suggest-options`: Allows a default suggestion source to be set.

#### example

html edit constraints
```html
<ml-constraints constraints="model.searchOptions.options.constraint" existing-indexes="model.rangeIndexes"></ml-constraints>
```
html using a structured query 
```html
<ml-suggest-options constraints="model.searchOptions.options.constraint" default-source="model.searchOptions.options['default-suggest-source']" options-name="'all'"></ml-suggest-options>
```
html using a structured query 
```html
<ml-sort-options constraints="model.searchOptions.options.constraint" sort-options="(model.searchOptions.options.operator|filter:{name: 'sort'})[0]" options-name="'all'"></ml-sort-options>
```
