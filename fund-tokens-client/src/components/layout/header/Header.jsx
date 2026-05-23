import { showDevUI } from "../../../config";

import "./Header.module.scss";

export default function Header({
    connect,
    address,
    disconnect,
    initSetUp,
}) {
    const formatAddress = (address) => {
        return `${address.slice(0, 12)}...${address.slice(-4)}`;
    };
    return (
        <header className="app-header">
            <div className="app-header__brand">
                <img
                    src="fund-tokens.jpg"
                    className="app-header__logo"
                    alt="logo"
                />
                <h1>Fun(d)Tokens [Chipnet]</h1>
            </div>
            <button
                id="wallet-btn"
                className="btn-secondary"
                onClick={
                    address ? disconnect : connect
                }
            >
                {address
                    ? formatAddress(address)
                    : "Connect Wallet"}
            </button>
            <button
                style={{ display: showDevUI ? '' : 'none' }}
                className="btn-secondary"
                disabled={!address}
                onClick={initSetUp}
            >
                Produce Tokens
            </button>
        </header>
    );
}