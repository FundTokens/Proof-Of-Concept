import { Outlet } from "react-router";
import { useWallet } from "@@contexts/walletContext";
import { useContracts } from "@@contexts/contractsContext";
import { useChaingraph } from "@@contexts/chaingraphContext";
import Header from "./header/Header";
import Footer from "./footer/Footer";

export default function RootLayout() {
    const {
        connect,
        address,
        disconnect,
        utxos,
        tokenBalances,
    } = useWallet();
    const { mint, redeem, createFundTx1 } = useContracts();
    const { funds, loadFunds } = useChaingraph();
    return (
        <>
            <Header
                connect={connect}
                address={address}
                disconnect={disconnect}
            />
            <Outlet context={{ mint, redeem, createFundTx1, utxos, address, tokenBalances, funds, loadFunds }} />
            <Footer />
        </>
    );
}
