import Moralis from 'moralis';
import 'dotenv/config';
import config from './config.js';
import {BigQuery} from '@google-cloud/bigquery';
const bigquery = new BigQuery({
    keyFilename: config.googleKeyFilePath,
});

const datasetId = config.bigQueryDatasetId;
const tableId = config.tableId;
const contract = config.contract
const lowBlock = config.lowestBlock;

console.log(process.env.MORALIS_API_KEY)

    Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
    });

    async function main() {
        let highBlock;
        if(!config.highestBlockOverride){
            const earliestBlockSynced = parseInt(await getEarliestBlockSynced());
            if(earliestBlockSynced <= lowBlock){
                console.log(`No blocks to sync. DB is already synced down to block ${earliestBlockSynced}`)
                return
            }
            console.log("Earliest block synced already:", earliestBlockSynced);
            
            highBlock = earliestBlockSynced - 1
        }
        else{
            highBlock = config.highestBlockOverride;
        }

        const startBlock = highBlock;
        const endBlock = lowBlock;

        const blocksToSync = Math.abs(endBlock - startBlock);
        console.log("Number of blocks to sync:", blocksToSync);
        fetchAndInsertBatches(startBlock, endBlock)

    }

    main();

    async function getEarliestBlockSynced(){
        const query = `
        SELECT block_number
        FROM \`${config.bigQueryDatasetId}.${config.bigQueryTableId}\`
        ORDER BY block_number ASC 
        LIMIT 1
    `;

    const [rows] = await bigquery.query({
        query: query 
    });
    return rows[0].block_number;
    }

    async function fetchAndInsertBatches(currentBlock, finalBlock){
        const batchSize = config.batchSize;
        const startBlock = currentBlock;
        const endBlock = (currentBlock - batchSize) > finalBlock ? (currentBlock - batchSize) : finalBlock

        console.log(`Fetching range ${startBlock} to ${endBlock}`)

        await fetchAndInsertBlocks(startBlock, endBlock);
        if(endBlock > finalBlock)
            return fetchAndInsertBatches(endBlock-1, finalBlock)
        return;
    }

  async function fetchAndInsertBlocks(blockRangeHigh, blockRangeLow){
    let transfers = await fetchAllTokenTransfers(blockRangeLow, blockRangeHigh);

    await bigquery.dataset(config.bigQueryDatasetId).table(config.bigQueryTableId).insert(transfers.map(transfer => ({
        tx_hash: transfer.transaction_hash,
        contract: transfer.address,
        from: transfer.from_address,
        to: transfer.to_address,
        value: transfer.value,
        decimals: transfer.token_decimals,
        symbol: transfer.token_symbol,
        token_name: transfer.token_name,
        block_number: transfer.block_number,
        chain: config.chainId,
        timestamp: transfer.block_timestamp
    })));
    console.log(`Inserted ${transfers.length} transfers in block range ${blockRangeLow}-${blockRangeHigh}`);
  }

  async function fetchAllTokenTransfers(startBlock, endBlock, cursor){
    const response = await Moralis.EvmApi.token.getTokenTransfers({
        chain: config.chainId,
        order: "ASC",
        fromBlock: startBlock,
        toBlock: endBlock,
        address: contract,
        cursor: cursor,
      });

      const json = response.toJSON();


      if (json.cursor) {
        return json.result.concat(await fetchAllTokenTransfers(startBlock, endBlock, json.cursor));
      }
      return json.result;
  }
