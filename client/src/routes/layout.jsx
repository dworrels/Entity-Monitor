import { Outlet, useNavigate, useLocation } from "react-router-dom";

import { useMediaQuery } from "@uidotdev/usehooks";
import { useClickOutside } from "../hooks/use-click-outside";

import { Sidebar } from "../layouts/sidebar";
{/* import { Header } from "../layouts/header"; */}
import { cn } from "../utils/cn";
import { useRef, useState, useEffect } from "react";
import SearchModal from "../components/SearchModal";

/* Layout component that contains the sidebar and header */
const Layout = () => {
    const isDesktopDevice = useMediaQuery("(min-width: 768px)");
    const [collapsed, setCollapsed] = useState(!isDesktopDevice);
    const [search, setSearch] = useState(""); 
    const [searchModalOpen, setSearchModalOpen] = useState(false);

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

const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("recentSearches");
    return saved ? JSON.parse(saved) : [];
});

const handleSearch = () => {
    if (search.trim()) {
        setRecentSearches(prev => {
            const updated = [search, ...prev.filter(s => s != search)].slice(0, 5);
            localStorage.setItem("recentSearches", JSON.stringify(updated));
            return updated;
        });
        setSearchModalOpen(false);
        if (location.pathname != "/") {
            navigate("/");
        }
    }
}

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
            />
            <div className={cn("transition-[margin] duration-300", collapsed ? "md:ml-[70px]" : "md:ml-[240px]")}>
                {/* <Header
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    search={search}
                    setSearch={setSearch}
                /> */}
                <div 
                    ref={scrollContainerRef}
                    className="h-[calc(100vh-60px)] overflow-x-hidden overflow-y-auto p-6"
                >
                    <Outlet context={{search, scrollContainerRef}} />
                </div>
            </div>
        </div>
    );
};

export default Layout;

