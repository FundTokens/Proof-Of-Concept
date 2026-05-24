import classes from "./Footer.module.scss";

export default function Footer() {
    return (
        <footer className={classes.footer}>
            <div
                className={classes.sitemap}
            >
                <div>
                    <h4>
                        Contact Us
                    </h4>
                    <div>
                        Email: <br />
                        <a href='mailto:admin@fundtokens.cash'>admin@fundtokens.cash</a>
                    </div>
                </div>

                <div>
                    <h4>
                        Community
                    </h4>
                    <div>
                        <a href='https://t.me/+CdbPyFNDA-ZkMTUx' target='_blank'><img style={{ height: '2rem', width: '2rem' }} src="/telegram.png" /></a>
                    </div>
                </div>

                <div>
                    <h4>
                        Smart Contracts
                    </h4>
                    <div>
                        <a href='https://github.com/FundTokens/Proof-Of-Concept/tree/main/fund-tokens-contracts/v0.0.2' target='_blank' rel='noopener noreferrer'>v0.0.2</a>
                    </div>
                </div>

                <div>
                    <h4>
                        Disclaimers
                    </h4>
                    <div
                        style={{ wordBreak:'keep-all' }}
                    >
                        <strong>**Hackathon POC</strong>
                        <div>
                            Fun(d)Tokens is not responsible for loss of BCH or CashTokens. Verify the transaction details for accuracy before sending.
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                            All tokens are only for testing, have no value, and we reserve the right to reset the system and discontinue using existing tokens.
                        </div>
                    </div>
                </div>
            </div>
            <div className={classes.copyright}>&copy; 2026 Fun(d)Tokens</div>
        </footer>
    );
}
