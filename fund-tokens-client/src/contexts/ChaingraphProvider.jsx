import { createContext, useEffect, useState, useContext, useRef } from "react";
import { ChanigraphContext } from './chaingraphContext';
import { getFunds, getFundsAssets, parseFund, parseFundAssets, parseOpReturn } from "@@services/ChaingraphService";
import { paytacaIndexerUrl } from "@@config";

export const ChaingraphProvider = ({ children }) => {

    function resolveUri(uri) {
        if (!uri) return "";
        if (uri.startsWith("ipfs://")) {
            return uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
        }
        if (uri.startsWith("http://") || uri.startsWith("https://")) {
            return uri;
        }
        return uri;
    }

    const [funds, setFunds] = useState({});

    const loadFunds = async () => {
        const result = await getFunds();
        const fundsArray = await Promise.all(
            result.map(async (f) => {
                console.log('transaction_hash', f.transaction_hash)
                const fundChunks = parseOpReturn(f.locking_bytecode);
                if (!fundChunks) return null;

                const fund = parseFund(fundChunks);
                console.log(`fund ${f.locking_bytecode}`, fund)
                const assetsTx = await getFundsAssets(fund.assets);
                if (!assetsTx) return fund;

                const assetChunks = parseOpReturn(assetsTx.locking_bytecode);
                if (!assetChunks) return fund;

                fund.assets = parseFundAssets(assetChunks);

                const res = await fetch(`${paytacaIndexerUrl}${fund.categoryId}`)
                const data = await res.json()

                console.log('data', data)

                fund.name = data.token?.symbol ?? 'Unknown';
                fund.icon = resolveUri(data.uris?.icon ?? './fund-tokens.jpg');

                await Promise.all(fund.assets.map(async (asset) => {
                    const res = await fetch(`${paytacaIndexerUrl}${asset.categoryId}`)
                    const data = await res.json()
                    asset.name = data.token?.symbol ?? 'Unknown'
                    asset.icon = resolveUri(data.uris?.icon ?? './fund-tokens.jpg')
                }))
                return fund;
            })
        );

        const fundsByCategory = fundsArray.reduce((acc, fund) => {
            acc[fund.categoryId] = fund;
            return acc;
        }, {})

        setFunds(fundsByCategory)

    };

    return (
        <ChanigraphContext.Provider value={{ funds, loadFunds }}>
            {children}
        </ChanigraphContext.Provider>
    );
};

export default ChaingraphProvider;

