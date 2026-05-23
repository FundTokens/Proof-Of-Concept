import { stringify, decodeCashAddress, encodeCashAddress } from '@bitauth/libauth';
import { fetchUnspentTransactionOutputs, initializeElectrumClient, subscribeToAddressUpdates, unsubscribeFromAddressUpdates } from '@electrum-cash/protocol';
import { SignClient } from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { log } from './LogService';
import { electrumClientHostname } from '../config';

export const WALLET_CONFIG = {
    projectId: "0c36b47109623309071ba16974f7c628",
    metadata: {
        name: "Fun(d)Tokens",
        description: "Fund(d)Tokens is a platform for tokenizing and trading assets.",
        url: "https://chipnet.fundtokens.cash",
        icons: ["https://chipnet.fundtokens.cash/fund-tokens.jpg"],
    }
};

const BCH_NAMESPACES = {
    requiredNamespaces: {
        bch: {
            chains: ["bch:bchtest"],
            methods: ["bch_getAddresses", "bch_signTransaction", "bch_signMessage"],
            events: ["addressesChanged"]
        }
    }
};

const modal = new WalletConnectModal({ projectId: WALLET_CONFIG.projectId });

function cashAddressToTokenAddress(address) {
    const decoded = decodeCashAddress(address);
    const encoded = encodeCashAddress({ prefix: decoded.prefix, type: 'p2pkhWithTokens', payload: decoded.payload });
    return encoded.address;
}

export class WalletService {
    _client = null;
    _clientPromise = null;
    _electrumClient = null;
    _session = null;
    _address = null;
    _tokenAddress = null;
    _bchUtxos = [];
    _tokenUtxos = [];
    _tokenBalances = {};
    _utxoResolvers = [];

    onStateChange = null;

    async init() {
        await Promise.all([
            this._initWalletConnect(),
            this._initElectrum()
        ]);
    }

    destroy() {
        log('destroying WalletService');
        this._client?.off("session_delete", this._handleSessionDelete);
        this._electrumClient?.disconnect();
    }

    get session() { return this._session; }
    get address() { return this._address; }
    get tokenAddress() { return this._tokenAddress; }
    get bchUtxos() { return this._bchUtxos; }
    get tokenUtxos() { return this._tokenUtxos; }
    get tokenBalances() { return this._tokenBalances; }

    async _initWalletConnect() {
        try {
            log('init client');
            if (!this._clientPromise) this._clientPromise = SignClient.init(WALLET_CONFIG);
            this._client = await this._clientPromise;
            this._client.on("session_delete", this._handleSessionDelete);
            log('wallet client ready', this._client);

            const sessions = this._client?.session?.getAll();
            log("Sessions length:", sessions?.length);

            if (sessions && sessions.length > 0) {
                const lastSession = sessions[sessions.length - 1];
                log("Session restored:", lastSession);
                this._session = lastSession;
                const addresses = await this._getBchAddresses(lastSession);
                this._address = addresses[0];
                this._tokenAddress = cashAddressToTokenAddress(addresses[0]);
                this._notify();
                await this._subscribeToAddress();
            }
        } catch (error) {
            console.error("Failed to initialize WalletConnect:", error);
        }
    }

    async _initElectrum() {
        this._electrumClient = await initializeElectrumClient('FundTokens', electrumClientHostname);
        log('electrum client ready', this._electrumClient);
    }

    _handleSessionDelete = () => {
        log("Disconnected from wallet");
        this._clearSession();
        this._notify();
    }

    _getBchAddresses(session) {
        return this._client.request({
            topic: session.topic,
            chainId: 'bch:bchtest',
            request: { method: 'bch_getAddresses', params: {} }
        });
    }

    async connect() {
        if (!this._client) return;
        try {
            log('attempting wallet connect');
            const { uri, approval } = await this._client.connect(BCH_NAMESPACES);
            if (uri) {
                log('WC_URI:', uri);
                await modal.openModal({ uri });
            }
            log('waiting approval');
            const session = await approval();
            modal.closeModal();
            this._session = session;
            const addresses = await this._getBchAddresses(session);
            this._address = addresses[0];
            this._tokenAddress = cashAddressToTokenAddress(addresses[0]);
            this._notify();
            await this._subscribeToAddress();
        } catch (error) {
            console.error("Failed to connect:", error);
        }
    }

    async disconnect() {
        if (!this._client || !this._session) return;
        try {
            await this._client.disconnect({ topic: this._session.topic });
            this._clearSession();
            this._notify();
            log("Disconnected successfully");
        } catch (error) {
            console.error("Failed to disconnect:", error);
        }
    }

    signTransaction(transactionObject) {
        if (!this._client || !this._session) return;
        return this._client.request({
            topic: this._session.topic,
            chainId: 'bch:bchtest',
            request: { method: 'bch_signTransaction', params: JSON.parse(stringify(transactionObject)) }
        });
    }

    _clearSession() {
        this._session = null;
        this._address = null;
        this._tokenAddress = null;
        this._bchUtxos = [];
        this._tokenUtxos = [];
        this._tokenBalances = {};
    }

    async _subscribeToAddress() {
        if (!this._electrumClient || !this._address) return;
        this._electrumClient.on('blockchain.address.subscribe', this._handleAddressUpdate);
        await subscribeToAddressUpdates(this._electrumClient, this._address);
        log('Subscribed to address updates');
        await this.refreshUtxos();
    }

    async _unsubscribeFromAddress() {
        if (!this._electrumClient || !this._address) return;
        this._electrumClient.off('blockchain.address.subscribe', this._handleAddressUpdate);
        await unsubscribeFromAddressUpdates(this._electrumClient, this._address);
    }

    _handleAddressUpdate = async (data) => {
        log('Subscription update received:', data);
        await this.refreshUtxos();
    }

    async refreshUtxos() {
        if (!this._electrumClient || !this._address) return;

        const utxos = await fetchUnspentTransactionOutputs(this._electrumClient, this._address, true, true);
        const mapped = utxos.map((utxo) => ({
            txid: utxo.tx_hash,
            vout: utxo.tx_pos,
            satoshis: BigInt(utxo.value),
            token: utxo.token_data ? {
                ...utxo.token_data,
                amount: BigInt(utxo.token_data.amount),
            } : undefined,
        }));

        this._bchUtxos = mapped.filter(u => !u.token);
        this._tokenUtxos = mapped.filter(u => u.token && !u.token.nft);
        this._tokenBalances = this._tokenUtxos
            .map(u => ({ category: u.token.category, amount: u.token.amount }))
            .reduce((acc, u) => {
                acc[u.category] = (acc[u.category] || 0n) + u.amount;
                return acc;
            }, {});

        log('utxos refreshed', mapped);
        this._notify();

        this._utxoResolvers.forEach(resolve => resolve());
        this._utxoResolvers = [];
    }

    waitForUtxoUpdate() {
        return new Promise((resolve) => {
            this._utxoResolvers.push(resolve);
        });
    }

    selectBCHUtxos(amount, options = {}) {
        let utxos = this._bchUtxos;
        if (options.filter) utxos = utxos.filter(options.filter);

        const sorted = [...utxos].sort((a, b) =>
            a.satoshis > b.satoshis ? -1 : a.satoshis < b.satoshis ? 1 : 0
        );

        let selected = [];
        let total = 0n;
        for (const utxo of sorted) {
            if (total >= amount) break;
            selected.push(utxo);
            total += utxo.satoshis;
        }

        const remaining = sorted.filter(u => !selected.includes(u));
        for (const utxo of remaining) {
            const change = total - amount;
            if (change === 0n || change >= 546n) break;
            selected.push(utxo);
            total += utxo.satoshis;
        }

        if (total < amount) throw new Error("Not enough BCH");
        return { selectedBchUtxos: selected, selectedBchAmount: total, changeBchAmount: total - amount };
    }

    selectTokenUtxos(category, amount) {
        const sorted = [...this._tokenUtxos]
            .filter(u => u.token.category === category)
            .sort((a, b) =>
                a.token.amount > b.token.amount ? -1 : a.token.amount < b.token.amount ? 1 : 0
            );

        let selected = [];
        let total = 0n;
        for (const utxo of sorted) {
            if (total >= amount) break;
            selected.push(utxo);
            total += utxo.token.amount;
        }

        if (total < amount) throw new Error("Not enough tokens");
        return { selectedTokenUtxos: selected, selectedTokenAmount: total, changeTokenAmount: total - amount };
    }

    _notify() {
        this.onStateChange?.({
            session: this._session,
            address: this._address,
            tokenAddress: this._tokenAddress,
            bchUtxos: this._bchUtxos,
            tokenUtxos: this._tokenUtxos,
            tokenBalances: this._tokenBalances,
        });
    }
}