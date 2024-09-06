# Database Particulars

## FAQ / Code Snippets
Q: How to check the entire database for all collections and documents?

A: Use the following snippet:
```
db.getCollectionNames().forEach(function(collectionName) {
    print('Collection: ' + collectionName);
    db.getCollection(collectionName).find().forEach(function(doc) {
        printjson(doc);
    });
});
```