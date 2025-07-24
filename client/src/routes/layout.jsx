import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useClickOutside } from "../hooks/use-click-outside";
import { Sidebar } from "../layouts/sidebar";
import { cn } from "../utils/cn";
import { useRef, useState, useEffect } from "react";
import SearchModal from "../components/SearchModal";

const Layout = () => {
    const isDesktopDevice = useMediaQuery("(min-width: 768px)");
    const [collapsed, setCollapsed] = useState(!isDesktopDevice);
    const [search, setSearch] = useState("");
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchType, setSearchType] = useState("boolean"); // "boolean" or "semantic"
    const [recentSearches, setRecentSearches] = useState(() => {
        const saved = localStorage.getItem("recentSearches");
        return saved ? JSON.parse(saved) : [];
    });
    const [articles, setArticles] = useState([]); // For semantic search results

    const sidebarRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setCollapsed(!isDesktopDevice);
    }, [isDesktopDevice]);

    useClickOutside([sidebarRef], () => {
        if (!isDesktopDevice && !collapsed) {
            setCollapsed(true);
        }
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setSearchModalOpen(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Main search handler
    const handleSearch = async (query = search, type = searchType) => {
        if (query.trim()) {
            setRecentSearches((prev) => {
                const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 5);
                localStorage.setItem("recentSearches", JSON.stringify(updated));
                return updated;
            });
            setSearchModalOpen(false);
            if (location.pathname !== "/") {
                navigate("/");
            }
            if (type === "semantic") {
                // Call your backend semantic search endpoint
                try {
                    const res = await fetch("/api/articles/semantic_search", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ query, top_k: 10 }),
                    });
                    let results = [];
                    if (res.ok) {
                        results = await res.json();
                    } else {
                        const text = await res.text();
                        console.error("Semantic search error:", text);
                    }
                    setArticles(results);
                } catch (err) {
                    console.error("Semantic search failed:", err);
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 transition-colors">
            <div
                className={cn(
                    "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
                    !collapsed && "max-md:pointer-event-auto max-md:z-50 max-md:opacity-30",
                )}
            />
            <Sidebar
                ref={sidebarRef}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                search={search}
                setSearch={setSearch}
                onSearchBarClick={() => setSearchModalOpen(true)}
            />
            <SearchModal
                open={searchModalOpen}
                onClose={() => setSearchModalOpen(false)}
                search={search}
                setSearch={setSearch}
                onSearch={handleSearch}
                recentSearches={recentSearches}
                setRecentSearches={setRecentSearches}
                searchType={searchType}
                setSearchType={setSearchType}
            />
            <div className={cn("transition-[margin] duration-300", collapsed ? "md:ml-[70px]" : "md:ml-[240px]")}>
                <div
                    ref={scrollContainerRef}
                    className="h-[calc(100vh-60px)] overflow-x-hidden overflow-y-auto p-6"
                >
                    <Outlet context={{ search, scrollContainerRef, articles }} />
                </div>
            </div>
        </div>
    );
};

export default Layout;
