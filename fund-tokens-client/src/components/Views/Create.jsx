import { useWallet } from "@@contexts/walletContext";
import { useContracts } from "@@contexts/contractsContext";
import { uploadFile } from "@@services/BCMRService";
import { useEffect, useState } from "react";
import { ElectrumNetworkProvider, TransactionBuilder, placeholderP2PKHUnlocker } from "cashscript";
import { WaitingForSignature } from "@@components/Modal";

import './Views.scss';

function Create() {
    const provider = new ElectrumNetworkProvider('chipnet');
    const { connect, address, tokenBalances, bchUtxos, signTransaction } = useWallet();
    const { createFund } = useContracts();

    const [uploadingImage, setUploadingImage] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        symbol: 'F-',
        icon: '',
        decimals: 0,
        totalSupply: 9223372036854775807n,
        selectedAssets: [],
        errors: null,
    });

    const validUtxos = bchUtxos?.filter(u => u.vout === 0) || [];
    const hasValidUtxos = validUtxos.length >= 3;
    const fundUtxos = validUtxos.slice(0, 3);

    const handleIconChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Only images are allowed");
            return;
        }

        setUploadingImage(true);
        try {
            const uri = await uploadFile(file);
            setForm({ ...form, icon: uri });
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image.");
        } finally {
            setUploadingImage(false);
        }
    }

    const createUtxo = async () => {
        let inputUtxo = bchUtxos.find(u => !u.token && u.vout !== 0 && u.satoshis > 2126);
        if (!inputUtxo) {
            inputUtxo = bchUtxos.find(u => !u.token && u.vout === 0 && u.satoshis > 2126)
        }

        const tx = new TransactionBuilder({ provider })

        tx.addInput(inputUtxo, placeholderP2PKHUnlocker(address))
        tx.addOutput({ to: address, amount: 1000n })
        tx.addOutput({ to: address, amount: inputUtxo.satoshis - 1580n })
        const wcTx = tx.generateWcTransactionObject({ broadcast: true, userPrompt: 'Setting required Utxo' })

        await signTransaction(wcTx);
    }


    const handleFormChange = (e) => {
        const value = (e.target.name === 'decimals' || e.target.name === 'totalSupply')
            ? Number(e.target.value)
            : e.target.value;

        setForm({
            ...form,
            [e.target.name]: value
        });
    };

    const toggleAsset = (categoryId) => {

        const exists = form.selectedAssets.find(asset => asset.categoryId === categoryId);

        if (exists) {
            setForm({
                ...form,
                selectedAssets: form.selectedAssets.filter(asset => asset.categoryId !== categoryId)
            });

        } else {
            if (form.selectedAssets.length >= 2) return;
            setForm({
                ...form,
                selectedAssets: [
                    ...form.selectedAssets,
                    { categoryId: categoryId }
                ]
            });
        }
    }

    const updateAssetAmount = (categoryId, amount) => {
        setForm({
            ...form,
            selectedAssets: form.selectedAssets.map(asset =>
                asset.categoryId === categoryId
                    ? { ...asset, amount: BigInt(amount) }
                    : asset
            )
        });
    };

    return (
        <div id="create-view" className="view-content">
            <div className="token-info">
                <h3>Create Fund</h3>
                <p className="subtext">Create a new fund token by defining its properties and assets.</p>
            </div>

            {
                hasValidUtxos && (
                    <div>
                        <div className="composition-list" style={{ marginBottom: "2rem" }}>
                            <div className="form-group">
                                <label>Name</label>
                                <input className="input-field" type="text" placeholder="Name" onChange={handleFormChange} value={form.name} name="name" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input className="input-field" type="text" placeholder="Description" onChange={handleFormChange} value={form.description} name="description" />
                            </div>
                            <div className="form-group">
                                <label>Symbol</label>
                                <input className="input-field" type="text" placeholder="Symbol" onChange={handleFormChange} value={form.symbol} name="symbol" />
                            </div>
                            <div className="form-group">
                                <label>Decimals</label>
                                <input className="input-field" type="number" placeholder="Decimals" onChange={handleFormChange} value={form.decimals} name="decimals" />
                            </div>
                            <div className="form-group">
                                <label>Total Supply</label>
                                <input className="input-field" type="number" placeholder="Total Supply" onChange={handleFormChange} value={form.totalSupply} name="totalSupply" />
                            </div>
                            <div className="form-group" style={{ marginBottom: "0" }}>
                                <label>Icon Image</label>
                                <input className="input-field" type="file" accept="image/*" onChange={handleIconChange} />
                                {uploadingImage && <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Uploading...</p>}
                                {form.icon && (
                                    <div style={{ marginTop: "1rem", textAlign: "center" }}>
                                        <img
                                            src={form.icon.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
                                            alt="preview"
                                            style={{ maxWidth: "200px", borderRadius: "8px", border: "1px solid var(--border)" }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="composition-list" style={{ marginBottom: "2rem" }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Select Assets (Max 2)</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {Object.entries(tokenBalances).map(([categoryId, amount]) => {
                                    const isSelected = form.selectedAssets.some(a => a.categoryId === categoryId);
                                    const isDisabled = !isSelected && form.selectedAssets.length >= 2;
                                    return (
                                        <label key={categoryId} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? "not-allowed" : "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleAsset(categoryId)}
                                                disabled={isDisabled}
                                                style={{ width: "1rem", height: "1rem", marginTop: "0" }}
                                            />
                                            <span className="asset-name">{categoryId}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {
                            form.selectedAssets.length > 0 && (
                                <div className="composition-list" style={{ marginBottom: "2rem" }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Asset Amounts</label>
                                    {
                                        form.selectedAssets.map((asset) => (
                                            <div key={asset.categoryId} className="form-group" style={{ marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr", gap: "0.25rem" }}>
                                                <p className="asset-name" style={{ marginBottom: "0", fontSize: "0.9rem" }}>{asset.categoryId}</p>
                                                <input
                                                    className="input-field"
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={asset.amount?.toString() || ''}
                                                    onChange={(e) => updateAssetAmount(asset.categoryId, e.target.value)}
                                                />
                                            </div>
                                        ))
                                    }
                                </div>
                            )
                        }
                    </div>
                )
            }

            <div className="form-group">
                <button
                    className="btn-primary"
                    disabled={processing || uploadingImage}
                    onClick={async () => {
                        if (!address) {
                            await connect();
                            return;
                        }

                        setProcessing(true);
                        setError(null);
                        try {
                            if (!hasValidUtxos) {
                                await createUtxo();
                            } else {
                                if(!form.name) {
                                    setError('Name is required');
                                } else if(!form.symbol) {
                                    setError('Symbol is required');
                                } else if(form.decimals < 0 || form.decimals > 8) {
                                    setError('Decimals must be between 0 and 8, inclusively');
                                } else if(!form.totalSupply) {
                                    setError('Total supply is required');
                                } else if(form.selectedAssets.length === 0 || form.selectedAssets.length > 2) {
                                    setError('One or two assets must be selected');
                                } else if(form.selectedAssets.map(a => !a.amount || a.amount === 0).some(a => a)) {
                                    setError('Every asset amount must be greater than zero');
                                } else {
                                    await createFund(fundUtxos, form);
                                }

                            }
                        } catch (error) {
                            console.error("Transaction processing error:", error);
                            setError(error.message ?? error);
                        } finally {
                            setProcessing(false);
                        }
                    }}
                >
                    {!address ? 'Connect Wallet' : !hasValidUtxos ? `You have ${validUtxos.length}/3 required Utxos, Click here to mint more` : 'Create Fund'}
                </button>
                { error && <div><strong>{error}</strong></div> }
            </div>

            { processing && <WaitingForSignature /> }
        </div>
    );
}

export default Create;
