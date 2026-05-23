import Modal from './Modal';

import './WaitingForSignature.scss'

function WaitingForSignature() {
    return (
        <Modal>
            <div
                style={{
                    display: 'grid',
                    alignContent: 'center',
                    justifyContent: 'center',
                    justifyItems: 'center',
                    rowGap: '1rem',
                }}
            >
                Waiting for transaction signature...
                <div
                    style={{
                        border: '0.5rem solid #f3f3f3', /* Light grey */
                        borderTop: '0.5rem solid #3498db', /* Blue */
                        borderRadius: '50%',
                        width: '4rem',
                        height: '4rem',
                        animation: 'spin 2s linear infinite',
                    }}
                />
            </div>
        </Modal>
    )
}

export default WaitingForSignature;