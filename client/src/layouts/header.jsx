{/*import { ChevronLeft, Search, X } from "lucide-react";
import PropTypes from "prop-types";

export const Header = ({ collapsed, setCollapsed, search, setSearch }) => {
    return (
        <header className="relative z-10 flex h-[60px] items-center justify-between bg-white px-4 shadow-md transition-colors">
            <div className="flex items-center gap-x-3">
                <button
                    className="btn-ghost size-10"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronLeft className={collapsed && "rotate-180"}/>
                </button>
                <div className="relative w-full max-w-xs">
                    <Search
                        size={20}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                        type="text"
                        name="search"
                        id="search"
                        // search placeholder
                        placeholder="Search..."
                        className="w-full bg-transparent text-slate-900 outline-0 placeholder:text-slate-500 pl-8 pr-8"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-200"
                            onClick={() => setSearch("")}
                            aria-label="Clear Search"
                        >
                            <X size={16} className="text-slate-500" />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
    search: PropTypes.string,
    setSearch: PropTypes.func,
};
*/}