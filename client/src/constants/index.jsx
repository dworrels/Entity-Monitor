//lucide react icons
import { Home, Rss, Plus, Folders } from "lucide-react";


/* Contains the links for the navbar */
export const navbarLinks = [
    {
        title: "Dashboard",
        links: [
            { label: "Home", icon: Home, path: "/" },
            {
                label: "My Feeds",
                icon: Rss,
                path: "/myfeeds",
            },
            {
                label: "Projects",
                icon: Folders,
                path: "/projects",
            },
            {
                label: "Add Feed",
                icon: Plus,
                path: "/addfeed",
            },
        ],
    },
];
