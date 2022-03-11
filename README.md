# Cli-Notes

#### A tool made for taking notes inside the terminal, so you won't have to leave your comfort zone

## Installation

```
$ git clone https://github.com/dandan-drori/cli-notes
$ cd cli-notes
$ npm ci
```

### Database:
You'll need either a local mongodb database or a remote one:
You can create a remote database from [mongodb atlas](https://www.mongodb.com/cloud/atlas/efficiency?utm_source=google&utm_campaign=gs_emea_israel_search_core_brand_atlas_desktop&utm_term=mongodb%20atlas&utm_medium=cpc_paid_search&utm_ad=e&utm_ad_campaign_id=12212624530&adgroup=115749707903&gclid=CjwKCAiAg6yRBhBNEiwAeVyL0JWSzWb7TryWgmhzUy8iJWwfqdEOxtpaj4PIll4OvY7tjRtZ50rPtxoCkRYQAvD_BwE)  
You can create a local database using [robo3t](https://robomongo.org/) or [mongodb compass](https://www.mongodb.com/products/compass)

### Environment Variables:
You'll first need to create an `.env` file  
it's content will be:
```
MONGO_URI=<your_mongodb_connection_string>  
NOTES_DB_NAME=<your_db_name>  
NOTES_COL_NAME=<your_collection_name>
```
*Don't forget to replace the placeholders with your values!

## Usage

#### With ts-node installed globally:
```
$ ts-node index.ts
```

#### With the Typescript compiler:
```
$ tsc
$ node dist/index.js
```