import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ContentCard from "../../components/ContentCard";
import Modal from "../../components/Modal";
import { matchesBooleanSearch } from "../../utils/booleanSearch";
import { Plus } from "lucide-react";

const PAGE_SIZE = 12;

const DashboardPage = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const [articles, setArticles] = useState([]);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const { search, scrollContainerRef } = useOutletContext();
    const [showModal, setShowModal] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [projectKeyword, setProjectKeyword] = useState("");

    const handleOpenModal = () => {
        setProjectKeyword(search);
        setShowModal(true);
    };

    const handleCreateProject = (e) => {
        e.preventDefault();
        fetch(`${API_BASE_URL}/api/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: projectName, keyword: projectKeyword }),
        })
        .then(res => res.json())
        .then(() => {
            setShowModal(false);
            setProjectName("");
            setProjectKeyword("");
        });
    };

    

    // Filter Articles by search
    const filteredArticles = articles.filter((article) => matchesBooleanSearch((article.title || "") + " " + (article.description || ""), search));

    // Keep refs for latest values
    const visibleCountRef = useRef(visibleCount);
    const filteredLengthRef = useRef(filteredArticles.length);

    useEffect(() => {
        visibleCountRef.current = visibleCount;
    }, [visibleCount]);
    useEffect(() => {
        filteredLengthRef.current = filteredArticles.length;
    }, [filteredArticles.length]);

    // Reset visibleCount when articles or search changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [articles, search]);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/articles`)
            .then((res) => res.json())
            .then((data) => {
                setArticles(data);
                setLoading(false);
            });
    }, [API_BASE_URL]);

    // Infinite scroll: load more on scroll
    useEffect(() => {
        const container = scrollContainerRef?.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 200 && visibleCountRef.current < filteredLengthRef.current) {
                setVisibleCount((v) => v + PAGE_SIZE);
            }
        };
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [scrollContainerRef]); // Register ONCE

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex flex-row gap-x-20">
            <h1 className="title">Latest Updates</h1>
            <button
                className="flex h-[40px] w-40 items-center justify-center rounded-lg border-0 border-slate-500 bg-blue-500 p-3 text-slate-100 transition-colors hover:bg-blue-600 ml-auto"
                onClick={handleOpenModal}
                disabled={!search}
            >
                <Plus size={18}/> Create Project
            </button>
            </div>
            
            <Modal isVisible={showModal} onClose={() => setShowModal(false)}>
                <div className="p-6">
                    <h3 className="mb-5 text-xl font-semibold text-gray-900"> Create New Projects</h3>
                    <form onSubmit={handleCreateProject}>
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">Project Name</label>
                            <input 
                                type="text"
                                value={projectName}
                                onChange={e => setProjectName(e.target.value)}
                                className="w-full rounded border border-gray-300 p-2"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">Search Query</label>
                            <input 
                                type="text"
                                value={projectKeyword}
                                onChange={e => setProjectKeyword(e.target.value)}
                                className="w-full rounded border border-gray-300 p-2"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600"
                        >
                            Create Project
                        </button>
                    </form>
                </div>

            </Modal>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {[...Array(PAGE_SIZE)].map((_, i) => (
                        <div
                            key={i}
                            className="h-[320px] max-w-sm animate-pulse rounded bg-gray-200"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredArticles.slice(0, visibleCount).map((article, idx) => (
                        <ContentCard
                            key={idx}
                            article={article}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
