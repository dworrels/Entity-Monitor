import DataTable from "react-data-table-component";
import Modal from "../../components/Modal";
import { useState, useEffect } from "react";
import { Trash2, SquarePen} from "lucide-react";  


const RSSFeedsPage = () => {
    const [showModal, setShowModal] = useState(false);

    const handleAddSource = async (source) => {
        try {
            const res = await fetch("http://192.168.5.48:8090/api/sources", {
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
            title: formData.get("title"),
            rssUrl: formData.get("rssUrl"),
        };
        handleAddSource(newSource);
        setShowModal(false);
    };
    
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchFeeds = async () => {
            const res = await fetch("http://192.168.5.48:8090/api/sources");
            const feeds = await res.json();
            setData(feeds);
        };
        fetchFeeds();
    }, []);

    

    {/* Data table column titles */}
    const columns = [
        {
            name: "Title",
            selector: (row) => row.title,
        },
        {
            name: "RSS Feed URL",
            selector: (row) => row.rssUrl,
        },
        {
            name:"Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <button className="text-blue-500 hover:underline "
                    onClick={() => handleEdit(row)}
                    >
                        <SquarePen />
                    </button>
                    <button className="text-red-500 hover:underline"
                    onClick={() => handleDelete(row.id)}
                    >
                        <Trash2 />
                    </button>
                </div>
            ),
        }
    ];


    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex flex-row gap-x-20">
                <h1 className="title">RSS Feeds</h1>

                {/* Add Feed Button */}
                <button
                    className="flex h-[40px] items-center rounded-lg border-0 border-slate-500 bg-blue-500 p-3 text-slate-100 transition-colors hover:bg-blue-600"
                    onClick={() => setShowModal(true)}
                >
                    + Add Feed
                </button>

                {/* Add Feed Modal Component */}
                <Modal
                    isVisible={showModal}
                    onClose={() => setShowModal(false)}
                >
                    <div className="p-6">
                        <h3 className="mb-5 text-xl font-semibold text-gray-900">Add New RSS Feed</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">Feed Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="w-full rounded border border-gray-300 p-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">RSS Feed URL</label>
                                <input
                                    type="text"
                                    name="rssUrl"
                                    className="w-full rounded border border-gray-300 p-2"
                                />
                            </div>
                            <button
                                type="submit"
                                className="rounded bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600"
                            >
                                Add Feed
                            </button>
                        </form>
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
