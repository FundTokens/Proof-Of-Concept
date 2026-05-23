import { createContext, useEffect, useState, useContext, useRef } from "react";
import { useWallet } from "./walletContext";
import { network } from "../config";
import { initProviderService, mintService, redeemService, getContractUtxosService, selectContractUtxosService, getContractAddressService, createFundTx1Service, createFundTx2Service } from "../services/ContractsService/Chipnet";
import { CreateBCMR, uploadBCMR } from "@@services/BCMRService";
import { ContractsContext } from './contractsContext';
import tokens from "../tokens.json";

export const ContractsProvider = ({ children }) => {

    const { address, tokenAddress, bchUtxos, tokenUtxos, selectBCHUtxos, selectTokenUtxos, signTransaction, waitForUtxoUpdate } = useWallet()

    const provider = useRef(null)

    const getContractUtxos = async (contract, provider, fundToken) => {
        return getContractUtxosService(contract, provider, fundToken)
    }

    const selectContractUtxos = async (contract, category, amount, provider, fundToken) => {
        return selectContractUtxosService(contract, category, amount, provider, fundToken)
    }

    const getContractAddress = async (contract, provider, fundToken) => {
        return getContractAddressService(contract, provider, fundToken)
    }

    const redeem = async (fundToken, redeemAmount) => {
        const amount = BigInt(fundToken.amount)
        const fundAssets = fundToken.assets
        const asset1ContractAddress = await getContractAddress('asset1', provider.current, fundToken)
        const asset2ContractAddress = await getContractAddress('asset2', provider.current, fundToken)


        if (!amount) {
            console.error('no amount provided', amount);
            return;
        }

        const { selectedContractUtxos: asset1Utxos, selectedContractAmount: asset1Amount, changeContractAmount: asset1ChangeAmount } = await selectContractUtxos('asset1', fundAssets[0].categoryId, (BigInt(redeemAmount) * BigInt(fundAssets[0].amount)), provider.current, fundToken)
        const { selectedContractUtxos: asset2Utxos, selectedContractAmount: asset2Amount, changeContractAmount: asset2ChangeAmount } = await selectContractUtxos('asset2', fundAssets[1].categoryId, (BigInt(redeemAmount) * BigInt(fundAssets[1].amount)), provider.current, fundToken)
        console.log('asset1Utxos', asset1Utxos)
        console.log('asset2Utxos', asset2Utxos)
        const { selectedTokenUtxos: fundTokenUtxos, selectedTokenAmount: fundTokenAmount, changeTokenAmount: fundTokenChangeAmount } = selectTokenUtxos(fundToken.categoryId, (BigInt(redeemAmount) * BigInt(amount)))

        let bchfee = 0n

        if (asset1ChangeAmount > 0n) bchfee += 1000n
        if (asset2ChangeAmount > 0n) bchfee += 1000n
        if (fundTokenChangeAmount > 0n) bchfee += 1000n

        bchfee += 1000n + 400n + (BigInt(asset1Utxos.length) * 220n) + (BigInt(asset2Utxos.length) * 220n) + (BigInt(fundTokenUtxos.length) * 220n)

        const { selectedBchUtxos, selectedBchAmount, changeBchAmount } = selectBCHUtxos(bchfee)

        bchfee += BigInt(selectedBchUtxos.length) * 220n

        bchfee += 1250n
        if (selectedBchAmount - bchfee < 0n) {
            throw new Error("Not enough BCH")
        }
        const finalBchChangeAmount = selectedBchAmount - bchfee

        console.log(amount, redeemAmount)
        const wctx = await redeemService(provider.current, fundToken, amount, fundAssets, asset1Utxos, asset2Utxos, redeemAmount, fundTokenUtxos, selectedBchUtxos, tokenAddress, asset1ChangeAmount, asset1ContractAddress, asset2ChangeAmount, asset2ContractAddress, finalBchChangeAmount, fundTokenChangeAmount)
        const ctx = await signTransaction(wctx)
    }

    const mint = async (fundToken, mintAmount) => {
        const amount = BigInt(fundToken.amount)
        const fundAssets = fundToken.assets
        if (!amount) {
            console.error('no amount provided', amount);
            return;
        }

        const { selectedTokenUtxos: asset1Utxos, selectedTokenAmount: asset1Amount, changeTokenAmount: asset1ChangeAmount } = selectTokenUtxos(fundAssets[0].categoryId, (BigInt(mintAmount) * BigInt(fundAssets[0].amount)))
        const { selectedTokenUtxos: asset2Utxos, selectedTokenAmount: asset2Amount, changeTokenAmount: asset2ChangeAmount } = selectTokenUtxos(fundAssets[1].categoryId, (BigInt(mintAmount) * BigInt(fundAssets[1].amount)))

        let bchfee = 0n

        if (asset1ChangeAmount > 0n) bchfee += 1000n
        if (asset2ChangeAmount > 0n) bchfee += 1000n

        bchfee += 1000n + 400n + (BigInt(asset1Utxos.length) * 220n) + (BigInt(asset2Utxos.length) * 220n)

        const { selectedBchUtxos, selectedBchAmount, changeBchAmount } = selectBCHUtxos(bchfee)
        bchfee += BigInt(selectedBchUtxos.length) * 220n

        bchfee += 1250n
        if (selectedBchAmount - bchfee < 0n) {
            throw new Error("Not enough BCH")
        }
        const finalBchChangeAmount = selectedBchAmount - bchfee
        const wctx = await mintService(provider.current, fundToken, amount, fundAssets, asset1Utxos, asset2Utxos, selectedBchUtxos, mintAmount, tokenAddress, finalBchChangeAmount, asset1ChangeAmount, asset2ChangeAmount)
        const ctx = await signTransaction(wctx)
    }

    const createFund = async (fundUtxos, form) => {

        const fundToken = {
            categoryId: fundUtxos[2].txid,
            amount: 1n,
            inflowCategory: fundUtxos[0].txid,
            outflowCategory: fundUtxos[1].txid,
            assets: form.selectedAssets
        }

        const managerContractAddress = await getContractAddress('manager', provider.current, fundToken)

        let { wcTx, bytes } = createFundTx1Service(provider.current, fundUtxos, form.selectedAssets, tokenAddress, managerContractAddress)

        let requiredFee = 2546n + BigInt(bytes)
        const inputSats = fundUtxos[0].satoshis + fundUtxos[1].satoshis

        console.log('requiredFee', requiredFee)
        console.log('inputSats', inputSats)

        if (inputSats > requiredFee) {

            console.log('i>r')

            const change = inputSats - requiredFee

            const { wcTx, bytes } = createFundTx1Service(provider.current, fundUtxos, form.selectedAssets, tokenAddress, managerContractAddress, undefined, change)

            const ctx = await signTransaction(wcTx)
        }

        if (inputSats === requiredFee) {

            console.log('i=r')

            const { wcTx, bytes } = createFundTx1Service(provider.current, fundUtxos, form.selectedAssets, tokenAddress, managerContractAddress)

            const ctx = await signTransaction(wcTx)
        }

        if (inputSats < requiredFee) {

            console.log('i<r')

            requiredFee += 546n

            const missing = requiredFee - inputSats

            const { selectedBchUtxos, selectedBchAmount, changeBchAmount } = selectBCHUtxos(missing, { filter: (u) => (u.vout === 0 ? u.txid !== fundUtxos[0].txid && u.txid !== fundUtxos[1].txid && u.txid !== fundUtxos[2].txid : true) })

            const { wcTx, bytes } = createFundTx1Service(provider.current, fundUtxos, form.selectedAssets, tokenAddress, managerContractAddress, selectedBchUtxos, changeBchAmount)

            const ctx = await signTransaction(wcTx)
        }

        await waitForUtxoUpdate()
        const fundContractAddress = await getContractAddress('fund', provider.current, fundToken)

        const bcmr = CreateBCMR(fundUtxos[2].txid, form.name, form.description, form.symbol, form.decimals, form.icon)

        // const uri = '';
        const uri = await uploadBCMR(bcmr); // TODO: disabled for now

        let { wcTx2, bytes2 } = createFundTx2Service(provider.current, fundUtxos, form.selectedAssets, tokenAddress, fundContractAddress, bcmr, uri, form.totalSupply)

        let requiredFee2 = 2092n + BigInt(bytes2)
        const inputSats2 = fundUtxos[2].satoshis

        console.log(requiredFee2)

        if (inputSats2 > requiredFee2) {

            console.log('i>r')

            const change = inputSats2 - requiredFee2

            const { wcTx2, bytes2 } = createFundTx2Service(provider.current, fundUtxos, form.selectedAssets, tokenAddress, fundContractAddress, bcmr, uri, form.totalSupply, undefined, change)

            const ctx = await signTransaction(wcTx2)
        }

        if (inputSats2 === requiredFee2) {

            console.log('i=r')

            const { wcTx2, bytes2 } = createFundTx2Service(provider.current, fundUtxos, form.selectedAssets, tokenAddress, fundContractAddress, bcmr, uri, form.totalSupply)

            const ctx = await signTransaction(wcTx2)
        }

        if (inputSats2 < requiredFee2) {

            console.log('i<r')

            const missing = requiredFee2 - inputSats2

            const { selectedBchUtxos, selectedBchAmount, changeBchAmount } = selectBCHUtxos(missing, { filter: (u) => (u.vout === 0 ? u.txid !== fundUtxos[0].txid && u.txid !== fundUtxos[1].txid && u.txid !== fundUtxos[2].txid : true) })

            const { wcTx2, bytes2 } = createFundTx2Service(provider.current, fundUtxos, form.selectedAssets, tokenAddress, fundContractAddress, bcmr, uri, form.totalSupply, selectedBchUtxos, changeBchAmount)
            const ctx = await signTransaction(wcTx2)
        }
    }

    useEffect(() => {
        const initProvider = async () => {
            provider.current = initProviderService(network)
        }
        initProvider()
    }, [])

    return (
        <ContractsContext.Provider value={{ mint, redeem, createFund }}>
            {children}
        </ContractsContext.Provider>
    );
};

export default ContractsProvider;

