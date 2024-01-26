# Datatable (lwc)
Some features here I demostrate for the developers, welcome for your feedback.

## Infinite loading (aka. lazy loading)
In this example, we will demonstrate the implementation of infinite loading using the connectedCallback method. Through various tests, I found that the @wire method is also effective, although it retrieves additional data very quickly. This speed means there's hardly an opportunity to display the lightning spinner, which typically indicates the loading of new data.

## Searchable combobox
A notable limitation of the official Lightning combobox is that it doesn't permit users to type; they can only select from the provided list. This becomes cumbersome as the list lengthens, making it frustrating to locate a specific item. The method presented here enables typing to search, functioning like a searchable combobox using SLDS syntax. It's particularly useful and recommended when the item list exceeds 5, 6, or around 10 entries.

## Reference
### lightning-datatable
https://developer.salesforce.com/docs/component-library/bundle/lightning-datatable/documentation

### lightning-combobox
https://developer.salesforce.com/docs/component-library/bundle/lightning-combobox/example

### slds component Combobox
https://www.lightningdesignsystem.com/components/combobox/

