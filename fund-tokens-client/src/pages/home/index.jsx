import { useParams } from "react-router";
import { useState, useEffect } from "react";
import { stringify } from "@bitauth/libauth";
import { useWallet } from "@@contexts/walletContext";
import { useChaingraph } from "@@contexts/chaingraphContext";
import formatAmount from "@@misc/formatAmount";
import tabs from '@@misc/tabs';
import Tabs from "../../components/Tabs";
import Views from "../../components/Views";
import { showDevUI } from "../../config";

export default function Home() {
    const { utxos, tokenBalances } = useWallet();
    const { funds, loadFunds } = useChaingraph();
    const [activeTab, setActiveTab] = useState(tabs.mint);

    useEffect(() => {
        loadFunds();
    }, []);

    const params = useParams();
    const fundCategoryId = params.fundCategoryId ?? "62cfd4ca0908a26c2d686f6ab795c4a8ee30d5b126040bf6e156f3f095319061"; //TODO remove fallback, needed because index route still setup
    // TODO: The fund token category id will be selected in the index page when built and fed to this view via route
    // TODO: Load the tokens to a global state, the list will be hardcoded to start with
    const fundToken = funds[fundCategoryId];

    return (
        <main className="app-main">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            {activeTab === tabs.mint && fundToken && <Views.Mint fundToken={fundToken} />}
            {activeTab === tabs.redeem && fundToken && <Views.Redeem fundToken={fundToken} />}
            {activeTab === tabs.create && <Views.Create />}
            {showDevUI && utxos &&
                utxos.map((utxo, index) => (
                    <p key={index}>
                        {" "}
                        {index}: {stringify(utxo)}
                    </p>
                ))}

            {showDevUI && tokenBalances &&
                Object.entries(tokenBalances).map(([category, amount], index) =>
                    <p key={index}> {category}: {amount}</p>
                )}
            {
                tokenBalances && activeTab === tabs.mint && fundToken && fundToken.assets.map(a => (
                    <p>You have {formatAmount(tokenBalances[a.categoryId])} {a.name}</p>
                ))
            }
            {
                tokenBalances && activeTab === tabs.redeem && fundToken &&
                <p>You have {formatAmount(tokenBalances[fundToken.categoryId])} {fundToken.name}</p>
            }
            {activeTab !== tabs.create && <div className="composition-list">
                {
                    Object.values(funds).map(f => (
                        <>
                            <div className="composition-item">
                                <span className="asset-name"><a href={'/#/' + f.categoryId}>{f.name} - {f.categoryId}</a></span>
                            </div>
                        </>
                    ))
                }
            </div>}
        </main>
    );
}
