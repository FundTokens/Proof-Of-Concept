import { useState, useEffect, useRef } from 'react';
import { WalletContext } from './walletContext';
import { WalletService } from '../services/WalletConnectService';

const WalletProvider = ({ children }) => {
    const service = useRef(new WalletService());

    const [session, setSession] = useState(null);
    const [address, setAddress] = useState(null);
    const [tokenAddress, setTokenAddress] = useState(null);
    const [bchUtxos, setBchUtxos] = useState(null);
    const [tokenUtxos, setTokenUtxos] = useState(null);
    const [tokenBalances, setTokenBalances] = useState(null);

    useEffect(() => {
        service.current.onStateChange = (state) => {
            setSession(state.session);
            setAddress(state.address);
            setTokenAddress(state.tokenAddress);
            setBchUtxos(state.bchUtxos);
            setTokenUtxos(state.tokenUtxos);
            setTokenBalances(state.tokenBalances);
        };

        service.current.init();

        return () => service.current.destroy();
    }, []);

    return (
        <WalletContext.Provider value={{
            // estado para la UI
            session,
            address,
            tokenAddress,
            utxos: bchUtxos && tokenUtxos ? [...bchUtxos, ...tokenUtxos] : null,
            bchUtxos,
            tokenUtxos,
            tokenBalances,
            // métodos del servicio, siempre frescos
            connect: () => service.current.connect(),
            disconnect: () => service.current.disconnect(),
            signTransaction: (tx) => service.current.signTransaction(tx),
            selectBCHUtxos: (amount, options) => service.current.selectBCHUtxos(amount, options),
            selectTokenUtxos: (category, amount) => service.current.selectTokenUtxos(category, amount),
            waitForUtxoUpdate: () => service.current.waitForUtxoUpdate(),
        }}>
            {children}
        </WalletContext.Provider>
    );
};

export default WalletProvider;