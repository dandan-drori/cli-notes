# Cli-Notes

#### A tool made for taking notes inside the terminal, so you won't have to leave your comfort zone

## Installation

```
$ git clone https://github.com/dandan-drori/cli-notes
$ cd cli-notes
$ npm ci
```

## Usage

### Environment Variables:
You'll first need to create an `.env` file  
it's content will be:  
```
MONGO_URI=<your_mongodb_connection_string>  
NOTES_DB_NAME=<your_db_name>  
NOTES_COL_NAME=<your_collection_name>
```
*Don't forget to replace the placeholders with your values!

#### With ts-node installed globally:
```
$ ts-node index.ts
```

#### With the Typescript compiler:
```
$ tsc
$ node dist/index.js
```