import {
    Contract,
    TransactionBuilder,
} from 'cashscript';
import {
    swapEndianness,
    cashAddressToLockingBytecode,
} from '@bitauth/libauth';

import managerJson from './art/v0.0.2/manager.json' with { type: 'json' };
import fundJson from './art/v0.0.2/fund.json' with { type: 'json' };
import assetJson from './art/v0.0.2/asset.json' with { type: 'json' };

const DustAmount = 1000n;

export class FundTokenTransactionBuilder extends TransactionBuilder {
    inflowCategory = '';
    inflowCategorySwapped = '';
    outflowCategory = '';
    outflowCategorySwapped = '';

    // set higher order settings for the fund system
    setFundTokenSystem({
        inflowCategory,
        outflowCategory,
    }) {
        this.inflowCategory = inflowCategory;
        this.inflowCategorySwapped = swapEndianness(inflowCategory);
        this.outflowCategory = outflowCategory;
        this.outflowCategorySwapped = swapEndianness(outflowCategory);
        return this;
    }

    // build and get the contracts for this fund
    buildContracts({
        category,
        amount,
        assets,
    }) {

        const assetContracts = [];
        const managerParams = [];
        assets.forEach(a => {
            const fundAssetCategory = swapEndianness(a.categoryId);
            const assetContract = new Contract(assetJson, [this.outflowCategorySwapped, fundAssetCategory, BigInt(a.amount)], { provider: this.provider });

            assetContracts.push(assetContract);

            managerParams.push(cashAddressToLockingBytecode(assetContract.tokenAddress).bytecode);
            managerParams.push(fundAssetCategory);
            managerParams.push(BigInt(a.amount));
        });

        const fundContract = new Contract(fundJson, [this.inflowCategorySwapped, this.outflowCategorySwapped, swapEndianness(category)], { provider: this.provider });

        const managerContract = new Contract(managerJson, [
            this.inflowCategorySwapped,
            this.outflowCategorySwapped,
            cashAddressToLockingBytecode(fundContract.tokenAddress).bytecode,
            amount,
            ...managerParams,
        ], { provider: this.provider });

        console.log(managerContract.tokenAddress, fundContract.tokenAddress, assetContracts.map(a => a.tokenAddress));

        return { managerContract, fundContract, assetContracts };
    }

    // This method should be called while the transaction has same transaction input and output lengths
    // The consuming app is responsible for adding an output for Bitcoin change, fund token minted, and token change
    async addMint({
        amount,
        fund,
        fund: {
            category: fundCategory,
            amount: fundAmount,
            assets: fundAssets, // category, amount
        },
    }) {
        console.log('transaction builder...adding minting transaction');

        const { managerContract, fundContract, assetContracts } = this.buildContracts(fund);


        console.log('manager utxos', await managerContract.getUtxos())

        const inflowUtxo = (await managerContract.getUtxos()).filter(u => u.token?.category === this.inflowCategory)[0];
        const fundUtxo = (await fundContract.getUtxos()).filter(u => u.token?.category === fundCategory)[0];

        console.log('inflowUtxo', inflowUtxo);
        console.log('fundUtxo', fundUtxo);

        if (!inflowUtxo || !fundUtxo) {
            console.log('Missing required UTXO debug info:', {
                inflowCategory: this.inflowCategory,
                fundCategory: fundCategory,
                managerAddress: managerContract.tokenAddress,
                fundAddress: fundContract.tokenAddress,
                inflowUtxo,
                fundUtxo,
                managerUtxos: await managerContract.getUtxos(),
                fundUtxos: await fundContract.getUtxos()
            });
            throw new Error('Missing required UTXO');
        }

        const mintAmount = BigInt(fundAmount) * BigInt(amount);
        const fundChangeAmount = fundUtxo.token.amount - mintAmount;

        console.log('inflow', inflowUtxo)
        console.log('fund', fundUtxo)

        this.addInput(inflowUtxo, managerContract.unlock.inflow())
            .addInput(fundUtxo, fundContract.unlock.mint())
            .addOutputs([
                {
                    to: managerContract.tokenAddress,
                    amount: inflowUtxo.satoshis,
                    token: {
                        ...inflowUtxo.token,
                    },
                },
                {
                    to: fundContract.tokenAddress,
                    amount: fundUtxo.satoshis,
                    token: fundChangeAmount <= 0 ? null : {
                        category: fundCategory,
                        amount: fundChangeAmount,
                    },
                },
                ...assetContracts.map((assetContract, i) => ({
                    to: assetContract.tokenAddress,
                    amount: DustAmount,
                    token: {
                        category: fundAssets[i].categoryId,
                        amount: BigInt(fundAssets[i].amount) * BigInt(amount),
                    }
                })),
            ]);
        console.log('finished adding mint transaction i/o');
        return this;
    }

    // This method should be called while the transaction has same transaction input and output lengths
    // The consuming user is responsible for adding inputs for the fund token
    // The consuming app is responsible for adding an outputs for Bitcoin change and token change
    async addRedeem({
        amount,
        fund,
        fund: {
            category: fundCategory,
            amount: fundAmount,
            // assets: fundAssets, // category, amount
        },
        asset1Utxos,
        asset2Utxos,
    }) {
        console.log('transaction builder...adding redemption transaction');

        const { managerContract, fundContract, assetContracts } = this.buildContracts(fund);

        const outflowUtxo = (await managerContract.getUtxos()).filter(u => u.token?.category === this.outflowCategory)[0];
        // TODO: Iff no UTXO w/ at least one fund token, then still send the redeeming token to the empty UTXO or make one
        const fundUtxo = (await fundContract.getUtxos()).filter(u => u.token?.category === fundCategory)[0];

        const temp = await fundContract.getUtxos();
        console.log('testing', fund, temp);

        if (!outflowUtxo || !fundUtxo) {
            throw new Error('Missing required UTXO');
        }

        const redeemAmount = BigInt(fundAmount) * BigInt(amount);
        const updatedFundAmount = BigInt(fundUtxo.token.amount) + BigInt(redeemAmount);

        this.addInput(outflowUtxo, managerContract.unlock.outflow())
            .addInput(fundUtxo, fundContract.unlock.redeem())
            .addInputs(asset1Utxos, assetContracts[0].unlock.release())
            .addInputs(asset2Utxos, assetContracts[1].unlock.release())
            .addOutputs([
                {
                    to: managerContract.tokenAddress,
                    amount: outflowUtxo.satoshis,
                    token: {
                        ...outflowUtxo.token,
                    },
                },
                {
                    to: fundContract.tokenAddress,
                    amount: fundUtxo.satoshis,
                    token: {
                        category: fundCategory,
                        amount: updatedFundAmount,
                    },
                },
            ]);
        console.log('finished adding redemption transaction i/o');
        console.log('Outflow UTXO:', outflowUtxo);
        console.log('Fund UTXO:', fundUtxo);
        console.log('Asset 1 UTXO:', asset1Utxos);
        console.log('Asset 2 UTXO:', asset2Utxos);
        console.log('Outputs:', this.outputs);
        return this;
    }
}