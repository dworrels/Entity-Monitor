import { useState, useRef, useEffect } from "react";
import { Bell, Ellipsis } from "lucide-react";

const ProjectCard = ({ name, keyword, date, onClick, onEdit, onDelete }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            className="min-w-82 overflow-hidden rounded bg-white shadow-lg hover:opacity-75 hover:shadow"
            onClick={onClick}
        >
            <div className="px-6 py-4">
                <div className="mb-2 flex text-xl font-bold">
                    <span>{name}</span>
                    <div className="relative ml-auto inline-flex items-center rounded-lg bg-gray-200 p-2 text-center text-sm font-medium text-gray-700">
                        <Bell size={20} />
                        <span className="absolute -end-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-bold text-white dark:border-gray-900">
                            1
                        </span>
                    </div>
                    <div className="relative ml-2">
                        <button 
                            className="mt-1 rotate-90"
                            onClick={e => {
                                e.stopPropagation();
                                setShowDropdown(v => !v);
                            }}
                        >
                            <Ellipsis />
                        </button>
                        {showDropdown && (
                            <div ref={dropdownRef} className="absolute right-0 top-full mt-2 rounded bg-white shadow-lg border z-20">
                                <button
                                    className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setShowDropdown(false);
                                        onEdit();
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setShowDropdown(false);
                                        onDelete();
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <p className="mx-2 inline-block rounded bg-blue-100 px-2 py-1 text-base font-medium text-gray-700">{keyword}</p>
            </div>
            <div className="px-6 pt-4 pb-2">
                <span className="full mr-2 mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">{date}</span>
            </div>
        </div>
    );
};

export default ProjectCard;
