import DataTable from "react-data-table-component";
import Modal from "../../components/Modal";
import { useState, useEffect } from "react";
import { Trash2, SquarePen } from "lucide-react";

const RSSFeedsPage = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [showModal, setShowModal] = useState(false);
    const [data, setData] = useState([]);
    const [modalMode, setModalMode] = useState("add");
    const [editSource, setEditSource] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [sourceToDelete, setSourceToDelete] = useState(null);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    const handleAddSource = async (source) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/sources`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(source),
            });
            const result = await res.json();
            if (!res.ok) {
                setError(result.error || "Failed to add source");
                return false;
            }
            setData(result);
            setError("");
            return true;
        } catch {
            setError("Error adding source");
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.target);
        const newSource = {
            id: editSource?.id || formData.get("title").toLowerCase().replace(/\s+/g, ""),
            title: formData.get("title"),
            rssUrl: formData.get("rssUrl"),
        };

        let success;
        if (editSource) {
            success = await handleUpdateSource(newSource);
        } else {
            success = await handleAddSource(newSource);
        }
        if (success) {
            setShowModal(false);
            setEditSource(null);
            e.target.reset();
        }
    };

    useEffect(() => {
        const fetchFeeds = async () => {
            const res = await fetch(`${API_BASE_URL}/api/sources`);
            const feeds = await res.json();
            setData(feeds);
        };
        fetchFeeds();
    }, [API_BASE_URL]);

    const handleEdit = (row) => {
        setEditSource(row);
        setModalMode("edit");
        setShowModal(true);
        setError("");
    };

    const handleUpdateSource = async (updatedSource) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/sources/${updatedSource.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedSource),
            });
            const result = await res.json();
            if (res.ok) {
                setError(result.error || "Update Failed");
                return false;
            }
            setData(result);
            setError("");
            setShowModal(false);
            setEditSource(null);
            return true;
        } catch {
            setError("Update Failed");
            return false;
        }
    };

    const confirmDelete = async () => {
        if (!sourceToDelete) return;

        const res = await fetch(`${API_BASE_URL}/api/sources/${sourceToDelete.id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            const updatedSources = await res.json();
            setData(updatedSources);
        }

        setShowConfirmModal(false);
        setSourceToDelete(null);
    };

    {
        /* Data table column titles */
    }
    const columns = [
        {
            name: "Title",
            selector: (row) => row.title,
            sortable: true,
        },
        {
            name: "RSS Feed URL",
            selector: (row) => row.rssUrl,
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <button
                        className="text-gray-600 hover:underline"
                        onClick={() => handleEdit(row)}
                    >
                        <SquarePen />
                    </button>
                    <button
                        className="text-red-500 hover:underline"
                        onClick={() => {
                            setSourceToDelete(row);
                            setShowConfirmModal(true);
                        }}
                    >
                        <Trash2 />
                    </button>
                </div>
            ),
        },
    ];

    const filteredData = data.filter((source) => source.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex flex-row gap-x-12">
                <h1 className="title">RSS Feeds</h1>
                <input
                    className="flex h-[40px] w-40 items-center justify-center rounded-lg border-0 border-slate-500 p-1"
                    type="text"
                    placeholder="Search source title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {/* Add Feed Button */}
                <button
                    className="ml-auto flex h-[40px] w-40 items-center justify-center rounded-lg border-0 border-slate-500 bg-blue-500 p-3 text-slate-100 transition-colors hover:bg-blue-600"
                    onClick={() => {
                        setShowModal(true);
                        setModalMode("add");
                        setEditSource(null);
                    }}
                >
                    + Add Feed
                </button>

                {/* Add Feed Modal Component */}
                <Modal
                    isVisible={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setEditSource(null);
                        setError("");
                    }}
                >
                    <div className="p-6">
                        <h3 className="mb-5 text-xl font-semibold text-gray-900">{editSource ? "Edit RSS Feed" : "Add New RSS Feed"}</h3>

                        {error && <div className="mb-4 block text-sm font-medium text-red-500">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">Feed Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    defaultValue={editSource?.title || ""}
                                    className="w-full rounded border border-gray-300 p-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">RSS Feed URL</label>
                                <input
                                    type="text"
                                    name="rssUrl"
                                    defaultValue={editSource?.rssUrl || ""}
                                    className="w-full rounded border border-gray-300 p-2"
                                />
                            </div>
                            <button
                                type="submit"
                                className="rounded bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600"
                            >
                                {modalMode === "add" ? "Add Feed" : "Update Feed"}
                            </button>
                        </form>
                    </div>
                </Modal>

                {/* Confirm Delete */}
                <Modal
                    isVisible={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                >
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-semibold">Are you sure you want to delete?</h3>
                        <p className="mb-6 text-gray-700">{sourceToDelete?.title}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="rounded bg-gray-300 px-4 py-2 text-gray-800"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                                onClick={confirmDelete}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>

            {/* Data Table Component */}
            <DataTable
                columns={columns}
                data={filteredData}
                pagination
                highlightOnHover
            />
        </div>
    );
};

export default RSSFeedsPage;
