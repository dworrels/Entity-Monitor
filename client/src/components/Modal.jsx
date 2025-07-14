import React from "react";

function Modal({ isVisible, onClose, children }) {
    if (!isVisible) return null;

    const handleClose = (e) => {
        if (e.target.id === "wrapper") onClose();
    };

    return (
        <div
            className="fixed inset-0 z-10 flex items-center justify-center bg-black/25 backdrop-blur-sm"
            id="wrapper"
            onClick={handleClose}
        >
            <div className="relative flex w-[600px] flex-col">
                <div className="relative rounded bg-white p-2 ">
                    <button
                        className="absolute top-2 right-2 text-xl text-gray-500"
                        onClick={() => onClose()}
                    >
                        X
                    </button>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;
