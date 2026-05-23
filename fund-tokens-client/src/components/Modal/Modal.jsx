function Modal({ children}) {
    return (
        <div 
            style={{
                position: 'fixed',
                zIndex: 1,
                padding: '20rem',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.4)'
            }}
        >
            <div
                style={{
                    display: 'grid',
                    alignContent: 'center',
                    justifyContent: 'center',
                    height: '100%',
                }}
            >
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        padding: '3rem',
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;