import { forwardRef } from "react";
import { NavLink } from "react-router-dom";

import { navbarLinks } from "../constants";

import { cn } from "../utils/cn";

import favicon from "/public/favicon.ico";
import { ChevronLeft, Search, Command, Settings } from "lucide-react";
import PropTypes from "prop-types";

export const Sidebar = forwardRef(({ collapsed, setCollapsed, search, setSearch, onSearchBarClick }, ref) => {
    return (
        <aside
            ref={ref}
            className={cn(
                "transition_width_300ms_cubic-bezier(0.4,_0,_0.2_1),_left_300ms_cubic-bezier(0.4,_0,_0.2_1),_background-color_150ms_cubic-bezier(0.4,_0,_0.2_1)_border_150ms_cubic-bezier(0.4,_0,_0.2_1) fixed z-[100] flex h-full w-[240px] flex-col overflow-x-hidden border-r border-slate-300 bg-white",
                collapsed ? "md:w-[70px] md:items-center" : "md:w-[240px]",
                collapsed ? "max-md:left-full" : "max-md:left-0",
            )}
        >
            <div className="flex items-center justify-between gap-x-3 p-3">
                {collapsed ? (
                    <button
                        className="btn-ghost flex-items-center mx-auto size-10 justify-center"
                        onClick={() => setCollapsed(false)}
                        aria-label="Open Sidebar"
                    >
                        <ChevronLeft className="rotate-180" />
                    </button>
                ) : (
                    <>
                        <img
                            src={favicon}
                            alt="Logo"
                            className="h-8 w-8"
                        />
                        <p className="text-lg font-medium text-slate-900 transition-colors">TrackRSS</p>

                        <button
                            className="btn-ghost ml-auto size-10"
                            onClick={() => setCollapsed(true)}
                            aria-label="Close sidebar"
                        >
                            <ChevronLeft />
                        </button>
                    </>
                )}
            </div>
            <div className="flex w-full flex-col gap-y-4 overflow-x-hidden overflow-y-auto p-3 [scrollbar-width:_thin]">
                <div className="relative w-full max-w-xs">
                    <Search
                        size={20}
                        className="absolute top-1/2 left-2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                        type="text"
                        name="search"
                        id="search"
                        // search placeholder
                        placeholder="Search..."
                        className="w-full bg-transparent pr-8 pl-8 text-slate-900 outline-0 placeholder:text-slate-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={onSearchBarClick}
                        readOnly
                    />
                    {!collapsed && (
                        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center p-1 text-slate-500">
                            <Command size={15} /> K
                        </div>
                    )}
                </div>

                {navbarLinks.map((navbarLink) => (
                    <nav
                        key={navbarLink.title}
                        className={cn("sidebar-group", collapsed && "md:items-center")}
                    >
                        {!collapsed && <p className={cn("sidebar-group-title", collapsed && "md:w-[45px]")}>{navbarLink.title}</p>}
                        {navbarLink.links.map((link) => (
                            <NavLink
                                key={link.label}
                                to={link.path}
                                className={cn("sidebar-item", collapsed && "md:w-[45px]")}
                            >
                                <link.icon
                                    size={22}
                                    className="flex-shrink-0"
                                />
                                {!collapsed && <p className="whitespace-nowrap">{link.label}</p>}
                            </NavLink>
                        ))}
                    </nav>
                ))}
            </div>

            <div className="mt-auto w-full p-3">
                <NavLink
                    to="/settings"
                    className={cn(
                        "sidebar-item flex items-center gap-2 rounded px-3 py-2 text-slate-700 hover:bg-slate-100",
                        collapsed && "justify-center md:w-[45px]"
                    )}
                >
                    <Settings size={22} className="flex-shrink-0" />
                    {!collapsed && <span className="whitespace-nowrap">Settings</span>}
                </NavLink>
            </div>
        </aside>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
    search: PropTypes.string,
    setSearch: PropTypes.func,
    onSearchBarClick: PropTypes.func,
};
