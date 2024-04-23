# Moralis-BigQuery Export Script
This small nodeJS script will export ERC20 transfer data to BigQuery for any specified contract, chain and block range. This script has no check for adding duplicate blocks. So be careful which block ranges you start to sync and make sure that you don't insert the same block multiple times. 

The script will sync in order of highest block to lowest block in order to prevent gaps in block data in case the script fails.

## Pre-requisites
If you want to send live data into your data warehouse, you should set up a Moralis Stream before you run this script to make sure that you get all the new blocks automatically added into BigQuery. After that you can use this script to backfill as far back as you want. 

### Setup
1. Clone the repository
2. Run `npm install` in the project directory
3. Create a .env file in the project directory and add your moralis api key (GET HERE) as `MORALIS_API_KEY`
4. Create a Google Cloud Service Account. Create a key pair, download and place it in the project directory. 
5. Open config.js and add your contract address, chain, dataset ID, table ID, path to your google key file and the block from which point you want to sync. See section Syncing config for more details.
6. Run with `npm start`

### Syncing config
Inside config.js, there are some parameters that configure which contract and which block range to sync. 

`contract`: The ERC20 contract address  
`chainId`: The chain to sync.  
`lowestBlock`: The block from where you want to start your sync.  
`highestBlockOverride`: Leave as `null` and the script will automatically sync up until the oldest (lowest) block in your bigquery table. Only set this if you want to override where to stop the sync.  
`batchSize`: The amount of blocks to fetch and insert at once. The higher batch size, the faster the syncing. But you are limited by the maximum upload size to BigQuery in one request. For USDT I've found batch size 100 to be a good value. If you have a contract with less transfer activity you can increase this substantially.  
`bigQueryTableId`: Your bigquery table id  
`bigQueryDatasetId`: Your bigquery dataset id  
`googleKeyFilePath`: The path to your local google keyfile  
### Database schema
Your schema in BigQuery is assumed to look like the following. But you can of course modify it in main.js to fit your DB schema. Remember that there are multiple SQL and API calls you have to edit in case your schema is different. 

```json
        tx_hash: STRING,
        contract: STRING,
        from: STRING,
        to: STRING,
        value: BIGNUMERIC,
        decimals: INTEGER,
        symbol: STRING,
        token_name: STRING,
        block_number: STRING,
        chain: STRING,
        log_index: STRING,
        timestamp: TIMESTAMP
```