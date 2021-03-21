# Setup

```
npm install
```

# Examples

For pretty much all scripts you will need an Infrua API key (to talk to the Ethereum network). You can obtain one from here: https://infura.io/

## Fix all Dogira holder balances

Go to Etherscan and download the holder CSV for Dogira. Assuming it's stored at `/path/to/dogira-holders.csv`, then use
this command line to retrieve the correct balances.

```
node --require ts-node/register -r tsconfig-paths/register ./src/app.ts fix-balance-sheet --balance-sheet "/path/to/dogira-holders.csv" --infura-api-key INFURA_API_KEY --contract-address 0x4B86e0295E7d32433FfA6411B82B4F4e56a581E1
```