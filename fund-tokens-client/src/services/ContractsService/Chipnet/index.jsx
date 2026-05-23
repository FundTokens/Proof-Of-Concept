import { FundTokenTransactionBuilder } from '../FundTokenTransactionBuilder';
import { ElectrumNetworkProvider, placeholderP2PKHUnlocker, TransactionBuilder } from 'cashscript';
import { instantiateSha256, encodeTransaction, binToHex, hexToBin, flattenBinArray, bigIntToVmNumber, utf8ToBin } from '@bitauth/libauth';

const DustAmount = 1000n;

const sha256 = await instantiateSha256();

export function getContractUtxosService(contract, provider, fundToken) {
    const {
        inflowCategory,
        outflowCategory,
        categoryId: fundCategory,
        amount: fundAmount,
        assets: fundAssets,
    } = fundToken;

    const amountBN = BigInt(fundAmount);
    const assetsBN = fundAssets.map((asset) => ({
        ...asset,
        amount: BigInt(asset.amount),
    }));

    const { managerContract, fundContract, assetContracts } = new FundTokenTransactionBuilder({ provider })
        .setFundTokenSystem({ inflowCategory, outflowCategory })
        .buildContracts({
            category: fundCategory,
            amount: amountBN,
            assets: assetsBN,
        });

    if (contract === 'manager') return managerContract.getUtxos()

    if (contract === 'fund') return fundContract.getUtxos()

    if (contract === 'asset1') return assetContracts[0].getUtxos()

    if (contract === 'asset2') return assetContracts[1].getUtxos()

}

export async function selectContractUtxosService(contract, category, amount, provider, fundToken) {
    const utxos = await getContractUtxosService(contract, provider, fundToken)
    const categoryUtxos = utxos.filter((utxo) => utxo.token && utxo.token.category === category);
    const sortedUtxos = categoryUtxos.sort((a, b) =>
        a.token.amount > b.token.amount ? -1 :
            a.token.amount < b.token.amount ? 1 : 0
    );
    let selectedContractAmount = 0n;
    let selectedContractUtxos = [];
    for (const utxo of sortedUtxos) {
        if (selectedContractAmount >= amount) break;
        selectedContractUtxos.push(utxo);
        selectedContractAmount += utxo.token.amount;
    }
    if (selectedContractAmount < amount) {
        throw new Error("Not enough tokens");
    }
    return { selectedContractUtxos, selectedContractAmount, changeContractAmount: selectedContractAmount - amount };
}

export function getContractAddressService(contract, provider, fundToken) {
    const {
        inflowCategory,
        outflowCategory,
        categoryId: fundCategory,
        amount: fundAmount,
        assets: fundAssets,
    } = fundToken;

    const amountBN = BigInt(fundAmount);
    const assetsBN = fundAssets.map((asset) => ({
        ...asset,
        amount: BigInt(asset.amount),
    }));

    const { managerContract, fundContract, assetContracts } = new FundTokenTransactionBuilder({ provider })
        .setFundTokenSystem({ inflowCategory, outflowCategory })
        .buildContracts({
            category: fundCategory,
            amount: amountBN,
            assets: assetsBN,
        });

    if (contract === 'manager') return managerContract.tokenAddress

    if (contract === 'fund') return fundContract.tokenAddress

    if (contract === 'asset1') return assetContracts[0].tokenAddress

    if (contract === 'asset2') return assetContracts[1].tokenAddress
}

export function initProviderService(network) {
    const provider = new ElectrumNetworkProvider(network);
    return provider;
}

export async function mintService(...rest) {
    const [provider, fundToken, amount, fundAssets, asset1Utxos, asset2Utxos, bchUtxos, mintAmount, wallet, bchChange, asset1Change, asset2Change] = rest;
    console.log(`provider`, provider);
    console.log(`fundToken`, fundToken);
    console.log(`amount`, amount);
    console.log(`fundAssets`, fundAssets);
    console.log(`asset1Utxos`, asset1Utxos);
    console.log(`asset2Utxos`, asset2Utxos);
    console.log(`bchUtxos`, bchUtxos);
    console.log(`mintAmount`, mintAmount);
    console.log(`wallet`, wallet);
    console.log(`bchChange`, bchChange);
    console.log(`asset1Change`, asset1Change);
    console.log(`asset2Change`, asset2Change);

    const {
        inflowCategory,
        outflowCategory,
        categoryId,
    } = fundToken
    const builder = new FundTokenTransactionBuilder({ provider })

    builder.setFundTokenSystem({
        inflowCategory,
        outflowCategory,
    })
    await builder.addMint({
        amount: mintAmount,
        fund: {
            category: categoryId,
            amount,
            assets: fundAssets,
        }
    })
    builder.addInputs([...asset1Utxos, ...asset2Utxos, ...bchUtxos], placeholderP2PKHUnlocker(wallet))
    if (bchChange) {
        builder.addOutput({
            to: wallet,
            amount: bchChange,
        })
    }
    builder.addOutput({
        to: wallet,
        amount: DustAmount,
        token: {
            category: categoryId,
            amount: mintAmount,
        }
    })
    if (asset1Change) {
        builder.addOutput({
            to: wallet,
            amount: DustAmount,
            token: {
                category: fundAssets[0].categoryId,
                amount: asset1Change,
            }
        })
    }
    if (asset2Change) {
        builder.addOutput({
            to: wallet,
            amount: DustAmount,
            token: {
                category: fundAssets[1].categoryId,
                amount: asset2Change,
            }
        })
    }

    return builder.generateWcTransactionObject({ broadcast: true, userPrompt: 'Minting basket token' });
}

export async function redeemService(...rest) {
    console.log('redeem service input', rest);

    const [provider, fundToken, amount, fundAssets, asset1Utxos, asset2Utxos, redeemAmount, fundTokenUtxos, bchUtxos, wallet, asset1Change, asset1Contract, asset2Change, asset2Contract, bchChange, fundChange] = rest;

    const {
        inflowCategory,
        outflowCategory,
        categoryId,
        assets
    } = fundToken

    const builder = new FundTokenTransactionBuilder({ provider })

    builder.setFundTokenSystem({
        inflowCategory,
        outflowCategory,
    })

    await builder.addRedeem({
        amount: redeemAmount,
        fund: {
            category: categoryId,
            amount,
            assets: fundAssets,
        },
        asset1Utxos,
        asset2Utxos
    })
    builder.addInputs(fundTokenUtxos, placeholderP2PKHUnlocker(wallet))

    builder.addOutputs([
        {
            to: wallet,
            amount: DustAmount,
            token: {
                category: assets[0].categoryId,
                amount: BigInt(assets[0].amount) * redeemAmount,
            },
        },
        {
            to: wallet,
            amount: DustAmount,
            token: {
                category: assets[1].categoryId,
                amount: BigInt(assets[1].amount) * redeemAmount,
            }
        }
    ])

    builder.addInputs(bchUtxos, placeholderP2PKHUnlocker(wallet))
    if (bchChange) {
        builder.addOutput({
            to: wallet,
            amount: bchChange,
        })
    }
    if (asset1Change) {
        builder.addOutput({
            to: asset1Contract,
            amount: DustAmount,
            token: {
                category: fundAssets[0].categoryId,
                amount: asset1Change,
            }
        })
    }
    if (asset2Change) {
        builder.addOutput({
            to: asset2Contract,
            amount: DustAmount,
            token: {
                category: fundAssets[1].categoryId,
                amount: asset2Change,
            }
        })
    }
    if (fundChange) {
        builder.addOutput({
            to: wallet,
            amount: DustAmount,
            token: {
                category: categoryId,
                amount: fundChange,
            }
        })
    }

    console.log('wallet fund utxos', fundTokenUtxos)
    console.log('wallet bch utxos', bchUtxos)
    console.log('outputs', builder.outputs)
    console.log('assetContract', asset1Contract, asset2Contract)
    return builder.generateWcTransactionObject({ broadcast: true, userPrompt: 'Redeeming basket token' });
}

export function createFundTx1Service(...rest) {
    const [provider, fundUtxos, selectedAssets, address, managerContractAddress, fee, change] = rest;

    console.log('fee', fee)


    const tx = new TransactionBuilder({ provider })

    tx.addInput(fundUtxos[0], placeholderP2PKHUnlocker(address))
    tx.addInput(fundUtxos[1], placeholderP2PKHUnlocker(address))
    if (fee?.length > 1) {
        tx.addInputs(fee, placeholderP2PKHUnlocker(address))
    }
    if (fee?.length === 1) {
        tx.addInput(fee[0], placeholderP2PKHUnlocker(address))
    }
    tx.addOutput({ to: managerContractAddress, amount: 1000n, token: { category: fundUtxos[0].txid, amount: 1n, nft: { capability: 'none', commitment: '01' } } })
    tx.addOutput({ to: managerContractAddress, amount: 1000n, token: { category: fundUtxos[1].txid, amount: 1n, nft: { capability: 'none', commitment: '01' } } })
    if (change) {
        tx.addOutput({ to: address, amount: change })
    }
    tx.addOpReturnOutput(['fund', '0x02', `0x${fundUtxos[2].txid}`, '1', `0x${fundUtxos[0].txid}`, `0x${fundUtxos[1].txid}`, `0x${binToHex(sha256.hash(flattenBinArray([hexToBin(selectedAssets[0].categoryId), bigIntToVmNumber(selectedAssets[0].amount), hexToBin(selectedAssets[1].categoryId), bigIntToVmNumber(selectedAssets[1].amount)])))}`])
    const wcTx = tx.generateWcTransactionObject({ broadcast: true, userPrompt: 'Creating Fund' })
    const bytes = encodeTransaction(tx.buildLibauthTransaction()).length

    return { wcTx, bytes }
}

export function createFundTx2Service(...rest) {
    const [provider, fundUtxos, selectedAssets, address, fundContractAddress, bcmr, uri, supply, fee, change] = rest
    console.log(selectedAssets)
    console.log(bcmr)
    console.log(uri)
    console.log('fee', fee)
    const tx2 = new TransactionBuilder({ provider })
    tx2.addInput(fundUtxos[2], placeholderP2PKHUnlocker(address))
    if (fee?.length > 1) {
        tx2.addInputs(fee, placeholderP2PKHUnlocker(address))
    }
    if (fee?.length === 1) {
        tx2.addInput(fee[0], placeholderP2PKHUnlocker(address))
    }
    tx2.addOpReturnOutput(['BCMR', `0x${binToHex(sha256.hash(utf8ToBin(bcmr)))}`, uri])
    tx2.addOutput({ to: fundContractAddress, amount: 1000n, token: { category: fundUtxos[2].txid, amount: BigInt(supply) } })
    tx2.addOpReturnOutput([`0x${binToHex(sha256.hash(flattenBinArray([hexToBin(selectedAssets[0].categoryId), bigIntToVmNumber(selectedAssets[0].amount), hexToBin(selectedAssets[1].categoryId), bigIntToVmNumber(selectedAssets[1].amount)])))}`, `0x${selectedAssets[0].categoryId}`, selectedAssets[0].amount.toString(), `0x${selectedAssets[1].categoryId}`, selectedAssets[1].amount.toString()])
    if (change) {
        tx2.addOutput({ to: address, amount: change })
    }
    const wcTx2 = tx2.generateWcTransactionObject({ broadcast: true, userPrompt: 'Creating Fund' })
    const bytes2 = encodeTransaction(tx2.buildLibauthTransaction()).length

    return { wcTx2, bytes2 }
}