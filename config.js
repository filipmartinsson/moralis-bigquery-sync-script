const config = {
    lowestBlock: ,
    highestBlockOverride: null, //Leave as null if you want to sync up until the oldest (smallest) block number in your bigquery table. See readme for more info.
    contract: "0xdac17f958d2ee523a2206206994597c13d831ec7", //USDT
    bigQueryTableId: "",
    bigQueryDatasetId: "",
    googleKeyFilePath: './path-to-keyfile.json',
    batchSize: 100,
    chainId: "0x1" //Ethereum mainnet
  };
  
  export default config;