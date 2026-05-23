
import { useState } from "react";
import { useWallet } from "@@contexts/walletContext";
import { useContracts } from '@@contexts/contractsContext'
import { WaitingForSignature } from "@@components/Modal";
import formatAmount from "../../misc/formatAmount";
import TokenCategoryLink from "./TokenCategoryLink";

import tokens from '../../tokens.json';

import './Views.scss';

function MintView({ fundToken }) {
    const { mint } = useContracts();
    const { connect, address, tokenBalances } = useWallet();
    const [amount, setAmount] = useState(1);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const {
        name,
        categoryId,
        amount: fundAmount, // TODO: need to use for minting to support decimals and allowing additional use cases
        assets,
    } = fundToken;

    const bullBalance = tokenBalances?.[fundToken.assets[0].categoryId] || 0n;
    const bearBalance = tokenBalances?.[fundToken.assets[1].categoryId] || 0n;

    const requiredBull = BigInt(amount * fundToken.assets[0].amount);
    const requiredBear = BigInt(amount * fundToken.assets[1].amount);

    const hasEnoughTokens = bullBalance >= requiredBull && bearBalance >= requiredBear;

    return (
        <div id="mint-view" className="view-content">
            <div className="token-info">
                <img className="token-icon" src={fundToken.icon} />
                <h3>{name}</h3>
                <h5>{categoryId}</h5>
                <h5><TokenCategoryLink categoryId={categoryId} /></h5>
                <p className="subtext">Mint this fund token by locking up token assets.</p>
            </div>

            <div className="composition-list">
                {
                    assets.map(a => (
                        <div className="composition-item">
                            <span className="asset-name">
                                <img style={{ height: '2rem', borderRadius: '50%', marginRight: '0.25rem' }} src={a.icon} />
                                <TokenCategoryLink categoryId={a.categoryId}>{a.name} - {a.categoryId}</TokenCategoryLink>
                            </span>
                            <span className="asset-amount">{formatAmount(a.amount * amount)}</span>
                        </div>
                    ))
                }
                <div className="composition-item" style={{ borderTop: 'solid 1px gray' }}>
                    <span className="asset-name">{name}</span>
                    <span className="asset-amount">{formatAmount(fundAmount * amount)}</span>
                </div>
            </div>

            <div className="form-group">
                <label>Amount</label>
                <input type="number" id="mint-amount" value={amount} min="1" className="input-field" onChange={(e) => setAmount(e.target.value)} />
            </div>
            <button
                id="btn-mint"
                disabled={processing || (!!address && !hasEnoughTokens)}
                className="btn-primary"
                onClick={async () => {
                    if (!address) {
                        // TODO: Issue using processing bit when modal is closed without leaving page, keey here for now
                        await connect();
                        return;
                    }

                    setError(null);
                    setProcessing(true);
                    try {
                        console.log('click')
                        await mint(
                            fundToken,
                            BigInt(amount));

                    } catch (error) {
                        let display = error?.message ?? error.toString();
                        setError(display);
                        console.log('error whileing minting', display, error);
                    } finally {
                        setProcessing(false);
                    }
                }}
                onChange={(e) => setAmount(e.target.value)}
            >
                {!address ? "Connect wallet" : !hasEnoughTokens ? "Not enough tokens" : "Mint FundToken"}
            </button>
            {error && <div><strong>{error}</strong></div>}
            {
                processing && <WaitingForSignature />
            }
        </div>
    );
}

export default MintView;