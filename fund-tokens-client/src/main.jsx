import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

import "./main.css";

import WalletProvider from './contexts/WalletProvider';
import ContractsProvider from './contexts/ContractsProvider';
import ChaingraphProvider from './contexts/ChaingraphProvider';

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ChaingraphProvider>
            <WalletProvider>
                <ContractsProvider>
                    <App />
                </ContractsProvider>
            </WalletProvider>
        </ChaingraphProvider>
    </StrictMode>
);
