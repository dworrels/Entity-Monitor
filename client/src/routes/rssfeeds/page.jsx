import DataTable from "react-data-table-component";
import Modal from "../../components/Modal"
import { useState } from "react";

const RSSFeedsPage = () => {
    const [showModal, setShowModal] = useState(false);

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
            name: "Actions",
            cell: (row) => (
                <div>
                    <button onClick={() => handleEdit(row.id)}>Edit</button>
                    <button onClick={() => handleDelete(row.id)}>Delete</button>
                    <button onClick={() => handleAdd(row.id)}>Add</button>
                </div>
            ),
        },
    ];

    const data = [
        {
            id: 1,
            title: "Fox News",
            rssUrl: "https://moxie.foxnews.com/google-publisher/world.xml",
        },
        {
            id: 2,
            title: "Feed 2",
            rssUrl: "RSS Link for Feed 2",
        },
        {
            id: 3,
            title: "Feed 3",
            rssUrl: "RSS Link for Feed 3",
        },
        {
            id: 4,
            title: "Feed 4",
            rssUrl: "RSS Link for Feed 4",
        },
        {
            id: 5,
            title: "Feed 5",
            rssUrl: "RSS Link for Feed 5",
        },
        {
            id: 6,
            title: "Feed 6",
            rssUrl: "RSS Link for Feed 6",
        },
        {
            id: 7,
            title: "Feed 7",
            rssUrl: "RSS Link for Feed 7",
        },
        {
            id: 8,
            title: "Feed 8",
            rssUrl: "RSS Link for Feed 8",
        },
        {
            id: 9,
            title: "Feed 9",
            rssUrl: "RSS Link for Feed 9",
        },
        {
            id: 10,
            title: "Feed 10",
            rssUrl: "RSS Link for Feed 10",
        },
        {
            id: 11,
            title: "Feed 11",
            rssUrl: "RSS Link for Feed 11",
        }
    ];

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex flex-row gap-x-20">
                <h1 className="title">RSS Feeds</h1>

                {/* Add Feed Button */}
                <button className="flex h-[40px] items-center rounded-lg p-3 bg-blue-500 border-0 border-slate-500 text-slate-100 transition-colors hover:bg-blue-600" onClick={() => setShowModal(true)}>+ Add Feed</button>

                {/* Modal Component */}
                <Modal isVisible={showModal} onClose={() => setShowModal(false)}>
                    <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-5">Add New RSS Feed</h3>
                    <form>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Feed Title</label>
                            <input type="text" className="border border-gray-300 p-2 rounded w-full" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">RSS Feed URL</label>
                            <input type="text" className="border border-gray-300 p-2 rounded w-full" />
                        </div>
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded transition-colors hover:bg-blue-600">Add Feed</button>
                    </form>

                    </div>
                </Modal>

            </div>
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
