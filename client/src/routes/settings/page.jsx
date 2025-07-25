import { useState, useEffect } from "react";``

const MODEL_OPTIONS = [
    { label: "Groq Llama-4 Scout 17B", value: "groq-meta-llama/llama-4-scout-17b-16e-instruct"},
    { label: "Groq Llama-3 8B", value: "groq-llama3-8b-8192" },
    { label: "Mistral - Local", value: "mistral" },
];

const SettingsPage = () => {
    const [selectedModel, setSelectedModel] = useState(() =>
        localStorage.getItem("selectedModel") || MODEL_OPTIONS[0].value
    );

    useEffect(() => {
        localStorage.setItem("selectedModel", selectedModel);
    }, [selectedModel]);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <div className="mb-6">
                <label className="block font-medium mb-2">Select LLM Model</label>
                <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="border rounded px-3 py-2"
                >
                    {MODEL_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <p className="text-gray-600">Current Model: <span className="font-mono">{selectedModel}</span></p>
        </div>
    );
};

export default SettingsPage;