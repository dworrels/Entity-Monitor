import React, { useState } from "react";
import { X, Search, CalendarDays, Newspaper, ScanSearch } from "lucide-react";

const SearchModal = ({ open, onClose, search, setSearch, onSearch, recentSearches, setRecentSearches }) => {
    const [searchType, setSearchType] = useState("boolean");

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="text-lg font-semibold text-gray-800">Entity Search</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X />
                    </button>
                </div>

                {/* Search Input */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSearch(search, searchType);
                    }}
                >
                    <div className="relative mt-4 mb-3">
                        <Search
                            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <input
                            type="text"
                            autoFocus
                            className="w-full rounded-md border border-gray-300 bg-gray-100 py-2 pr-10 pl-10 text-sm placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none"
                            placeholder="What are you looking for?"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </form>
                {/* Filters */}
                <div className="mb-10 flex gap-2 text-sm text-gray-600">
                    {/* Boolean Toggle */}
                        {/* ...input... */}
                        <div className="mt-2 flex gap-2">
                            <button
                                type="button"
                                className={`rounded px-3 py-1 ${searchType === "boolean" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                                onClick={() => setSearchType("boolean")}
                            >
                                Boolean
                            </button>
                            <button
                                type="button"
                                className={`rounded px-3 py-1 ${searchType === "semantic" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                                onClick={() => setSearchType("semantic")}
                            >
                                Semantic
                            </button>
                        </div>
                    {/* Date and Source Filters */}
                    <button className="flex items-center gap-1 rounded border px-2 py-1 hover:bg-gray-100">
                        <CalendarDays /> Date ▼
                    </button>
                    <button className="flex items-center gap-1 rounded border px-2 py-1 hover:bg-gray-100">
                        <Newspaper /> Source ▼
                    </button>
                </div>
                {/* Recent Section */}
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Recent</span>
                    {recentSearches.length > 0 && (
                        <button
                            className="text-xs text-blue-500 hover:underline"
                            onClick={() => {
                                localStorage.removeItem("recentSearches");
                                if (typeof setRecentSearches === "function") setRecentSearches([]);
                            }}
                        >
                            Clear Recent
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {recentSearches.length > 0 ? (
                        recentSearches.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setSearch(item);
                                    onSearch();
                                }}
                                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100"
                            >
                                <div className="font-medium text-gray-800">{item}</div>
                                <div className="text-xs text-gray-500">Created by you · Last viewed just now</div>
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-sm text-gray-400">No recent searches</div>
                    )}
                </div>

                {/* Results Section */}
                <div className="mt-5 text-sm font-medium text-gray-600">Trending Searches</div>
                <div className="space-y-2">
                    <div className="rounded-md px-3 py-2 hover:bg-gray-100">
                        <div className="font-medium text-gray-800">Third document</div>
                        <div className="text-xs text-gray-500">Created by Olivia Pope · Last viewed 1 week ago</div>
                    </div>
                    <div className="rounded-md px-3 py-2 hover:bg-gray-100">
                        <div className="font-medium text-gray-800">Fourth document</div>
                        <div className="text-xs text-gray-500">Created by Olivia Pope · Last viewed 3 weeks ago</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
