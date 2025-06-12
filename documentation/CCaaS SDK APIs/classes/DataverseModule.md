# Dataverse Module
| Method | Availability |
| ------ | ------------ |
| [retrieveMultipleRecords](DataverseModule.md#retrievemultiplerecords) | Embed (Public Preview) |
| [retrieveRecord](DataverseModule.md#retrieverecord) | Embed (Public Preview) |


## Methods

### retrieveMultipleRecords
**`Description`**

Retrieves multiple records from a Dataverse entity.
This API fetches records based on the provided entityLogicalName and options.
**retrieveMultipleRecords**<`T`\>(`entityLogicalName`, `options`): `Promise`<`T`\>

#### Type parameters

| Name |
| :--- |
| `T`  |

#### Parameters

| Name                | Type     | Description                                                                                                                                                                         |
| :------------------ | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entityLogicalName` | `string` | The table logical name of the records you want to retrieve. For example: account                                                                                                    |
| `options`           | `string` | The query options used to filter, sort, or manipulate the data retrieval. This may include OData query parameters such as `$filter`, `$select`, `$orderby`, or a `fetchXml` string. |

#### Returns

`Promise`<`T`\>

A promise that resolves with the list of records fetched from the Dataverse.
The records are returned as an array of objects of type `T`, where `T` is a generic type representing the structure of the records.

**`Throws`**

Throws an error if `entityLogicalName`, `options` are missing or invalid

**`Example`**

```ts
// Example using OData query options
Microsoft.CCaaS.EmbedSDK.dataverse.retrieveMultipleRecords("accounts", "?$select=name&$top=3").then(
	function success(result) {
		for (var i = 0; i < result.entities.length; i++) {
			console.log(result.entities[i]);
		}
		// perform additional operations on retrieved records
	},
	function (error) {
		console.log(error.message);
		// handle error conditions
	}
);

// Example using FetchXml
const fetchXml =
	"?fetchXml=<fetch mapping='logical'><entity name='account'><attribute name='accountid'/><attribute name='name'/></entity></fetch>";
Microsoft.CCaaS.EmbedSDK.dataverse.retrieveMultipleRecords("accounts", fetchXml).then(
	function success(result) {
		for (var i = 0; i < result.entities.length; i++) {
			console.log(result.entities[i]);
		}
		// perform additional operations on retrieved records
	},
	function (error) {
		console.log(error.message);
		// handle error conditions
	}
);
```



---

### retrieveRecord
**`Description`**

Retrieves a single record from a Dataverse entity by its unique identifier.
This API fetches a specific record based on the provided entity logical name, record ID, and options.
**retrieveRecord**(`entityLogicalName`, `id`, `options`): `Promise`<[`Entity`](../modules.md#entity)\>

#### Parameters

| Name                | Type     | Description                                                                                                                                              |
| :------------------ | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entityLogicalName` | `string` | The table logical name of the records you want to retrieve. For example: account This path represents the specific collection of data you want to query. |
| `id`                | `string` | The unique identifier of the record to retrieve. This ID is used to locate the specific record within the entity set.                                    |
| `options`           | `string` | The query options used to filter, select, or manipulate the data retrieval. This may include OData query parameters such as `$select` or `$expand`.      |

#### Returns

`Promise`<[`Entity`](../modules.md#entity)\>

A promise that resolves with the record fetched from the Dataverse.
The record is returned as an object of type `Entity`, representing the structure of the record.


**`Throws`**

Throws an error if `entityLogicalName`, `id`, `options` are missing or invalid

**`Example`**

```ts
// Example using OData query options
Microsoft.CCaaS.EmbedSDK.dataverse
	.retrieveRecord("accounts", "00000000-0000-0000-0000-000000000000", "?$select=name")
	.then(
		function success(result) {
			console.log(result);
			// perform additional operations on the retrieved record
		},
		function (error) {
			console.log(error.message);
			// handle error conditions
		}
	);
```
