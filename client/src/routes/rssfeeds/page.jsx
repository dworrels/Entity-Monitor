import DataTable from "react-data-table-component";
import Modal from "../../components/Modal";
import { useState, useEffect } from "react";
import { Trash2, SquarePen } from "lucide-react";

const RSSFeedsPage = () => {
    const [showModal, setShowModal] = useState(false);
    const [data, setData] = useState([]);
    const [modalMode, setModalMode] = useState("add");
    const [editSource, setEditSource] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [sourceToDelete, setSourceToDelete] = useState(null);

    const handleAddSource = async (source) => {
        try {
            const res = await fetch("http://192.168.5.49:8090/api/sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(source),
            });
            // Refresh the data table after adding a new source
            if (!res.ok) {
                throw new Error("Failed to add source");
            }

            const updatedSources = await res.json();
            setData(updatedSources);
        } catch (err) {
            console.error("Error adding source:", err);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newSource = {
            id: editSource?.id || formData.get("title").toLowerCase().replace(/\s+/g, ""),
            title: formData.get("title"),
            rssUrl: formData.get("rssUrl"),
        };

        if (editSource) {
            handleUpdateSource(newSource);
        } else {
            handleAddSource(newSource);
        }
        setShowModal(false);
        setEditSource(null);
        e.target.reset();
    };

    useEffect(() => {
        const fetchFeeds = async () => {
            const res = await fetch("http://192.168.5.49:8090/api/sources");
            const feeds = await res.json();
            setData(feeds);
        };
        fetchFeeds();
    }, []);

    const handleEdit = (row) => {
        setEditSource(row);
        setModalMode("edit");
        setShowModal(true);
    };

    const handleUpdateSource = async (updatedSource) => {
        const res = await fetch(`http://192.168.5.49:8090/api/sources/${updatedSource.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedSource),
        });

        if (res.ok) {
            const updatedList = await res.json();
            setData(updatedList);
            setShowModal(false);
            setEditSource(null);
        } else {
            console.error("Update Failed");
        }
    };

    const confirmDelete = async () => {
        if (!sourceToDelete) return;

        const res = await fetch(`http://192.168.5.49:8090/api/sources/${sourceToDelete.id}`, {
            method: "DELETE"
        }); 

        if (res.ok) {
            const updatedSources = await res.json();
            setData(updatedSources);
        }

        setShowConfirmModal(false);
        setSourceToDelete(null);
    }

    
    {/* Data table column titles */}
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
                        className="text-blue-500 hover:underline"
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

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex flex-row gap-x-20">
                <h1 className="title">RSS Feeds</h1>
                
                {/* Add Feed Button */}
                <button
                    className="w-40 flex h-[40px] items-center justify-center rounded-lg border-0 border-slate-500 bg-blue-500 p-3 text-slate-100 transition-colors hover:bg-blue-600"
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
                    onClose={() => setShowModal(false)}
                >
                    <div className="p-6">
                        <h3 className="mb-5 text-xl font-semibold text-gray-900">{editSource ? "Edit RSS Feed" : "Add New RSS Feed"}</h3>
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

                <Modal isVisible={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Are you sure you want to delete?</h3>
                        <p className="mb-6 text-gray-700">{sourceToDelete?.title}</p>
                        <div className="flex justify-end gap-3">
                            <button
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                            onClick={() => setShowConfirmModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
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
                data={data}
                pagination
                highlightOnHover
            />
        </div>
    );
};

export default RSSFeedsPage;
