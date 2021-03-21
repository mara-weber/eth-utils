import * as yargs from "yargs";
import {EthBalanceSheetFixer} from "./EthBalanceSheetFixer";

yargs
    .scriptName("eth-utils")
    .usage('$0 <cmd> [args]')
    .command('fix-balance-sheet', 'Fixes the balance sheet emitted by Etherscan, by querying ERC20 balanceOf directly for each holder.', (yargs) => {
        yargs.option('balanceSheet', {
            type: 'string',
            alias: 'balance-sheet',
            demandOption: true,
            describe: `The balance sheet that is to be fixed.`
        })
        yargs.option('contractAddress', {
            type: 'string',
            alias: 'contract-address',
            demandOption: true,
            describe: `Which contract to query balances from (needs to be an ERC20 contract).`
        })
        yargs.option('infuraApiKey', {
            type: 'string',
            alias: 'infura-api-key',
            demandOption: true,
            describe: `The API for Infura.`
        })
    }, async function (argv) {

        await new EthBalanceSheetFixer({
            balanceSheet: <any>argv.balanceSheet,
            contractAddress: <any>argv.contractAddress,
            infuraApiKey: <any>argv.infuraApiKey,
        }).run()
    })
    .help()
    .showHelpOnFail(true, "Specify --help for available options")
    .argv

