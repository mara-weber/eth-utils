import {ChainId, Fetcher, Token} from '@uniswap/sdk'
import {InfuraProvider} from "@ethersproject/providers";
import {Contract} from "@ethersproject/contracts";
import * as fs from 'fs';

export class EthBalanceSheetFixer {
    private readonly provider: InfuraProvider;
    private readonly config: EthBalanceSheetFixerArgs;
    private readonly network: string = "mainnet";

    constructor(config: EthBalanceSheetFixerArgs) {
        this.config = config;
        this.provider = new InfuraProvider(this.network, config.infuraApiKey);
    }

    public async run() {
        const token: Token = await this.resolveTokenAsync(this.config.contractAddress);
        const lines = fs.readFileSync(this.config.balanceSheet, 'UTF-8').split(/\r?\n/);
        var outputLines = [];
        var lineIndex = 0;

        for (const line of lines) {
            const progress = Math.round((lineIndex * 100.0) / Math.max(lines.length, 1));
            try {
                const holderAddress = /.*(0x[0-9a-fA-F]{40}).*/.exec(line)[1];
                const balance = await this.getBalanceOf(holderAddress, token);

                console.log(`${progress}%: ${holderAddress} => ${balance} ${token.symbol}`);

                outputLines.push(`${holderAddress}, ${balance}`);
            } catch (e) {
                console.error(`${progress}%: Could not retrieve balance for line [${line}]: ${e}`);
            }

            lineIndex++;
        }

        fs.writeFileSync(this.config.balanceSheet + ".fixed.csv", outputLines.join("\n"),'UTF-8')
    }

    public async resolveTokenAsync(address: string): Promise<Token> {
        try {
            return await Fetcher.fetchTokenData(
                this.getChainIdForNetwork(this.network),
                address,
                this.provider,
                await this.queryErc20TokenSymbols(address)
            )
        } catch (e) {
            throw new Error(`Could not resolve token address [${address}] for network [${this.network}].`)
        }
    }

    public async queryErc20TokenSymbols(contractAddress: string): Promise<string> {
        try {
            const erc20Contract = new Contract(
                contractAddress,
                this.getErc20Abi(),
                this.provider
            );

            return (await erc20Contract.functions.symbol()).toString();

        } catch (e) {
            throw new Error(`Unable to determine symbol for contract [${contractAddress})]. It may not be a valid ERC-20 token: ${e}`)
        }
    }

    public async getBalanceOf(walletAddress: string, token: Token): Promise<number> {
        const erc20Contract = new Contract(
            token.address,
            this.getErc20Abi(),
            this.provider
        );

        return this.toNumberAmount((await erc20Contract.functions.balanceOf(walletAddress)).toString(), token);
    }

    private getChainIdForNetwork(network: String): ChainId {
        switch (network) {
            case "mainnet":
                return ChainId.MAINNET
            case "rinkeby":
                return ChainId.RINKEBY
            case "kovan":
                return ChainId.KOVAN
            default:
                throw new Error(`Network [${network}] is not supported.`)
        }
    }

    private getErc20Abi() {
        return JSON.parse("[{\"constant\":true,\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"_spender\",\"type\":\"address\"},{\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"approve\",\"outputs\":[{\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"totalSupply\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"_from\",\"type\":\"address\"},{\"name\":\"_to\",\"type\":\"address\"},{\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"transferFrom\",\"outputs\":[{\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"decimals\",\"outputs\":[{\"name\":\"\",\"type\":\"uint8\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"_owner\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"name\":\"balance\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"_to\",\"type\":\"address\"},{\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"transfer\",\"outputs\":[{\"name\":\"\",\"type\":\"bool\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"_owner\",\"type\":\"address\"},{\"name\":\"_spender\",\"type\":\"address\"}],\"name\":\"allowance\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"payable\":true,\"stateMutability\":\"payable\",\"type\":\"fallback\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"spender\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Approval\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"}]")
    }

    private toNumberAmount(expandedAmount: string, token: Token): number {
        return +expandedAmount / (10.0 ** token.decimals);
    }
}

export interface EthBalanceSheetFixerArgs {
    readonly balanceSheet: string;
    readonly contractAddress: string;
    readonly infuraApiKey: string;
}
