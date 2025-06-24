//lucide react icons
import { Home, Rss, Bookmark, Folders } from "lucide-react";


/* Contains the links for the navbar */
export const navbarLinks = [
    {
        title: "Dashboard",
        links: [
            { label: "Home", icon: Home, path: "/" },
            {
                label: "Projects",
                icon: Folders,
                path: "/projects",
            },
            {
                label: "RSS Feeds",
                icon: Rss,
                path: "/rssfeeds",
            },
            {
                label: "Favorites",
                icon: Bookmark,
                path: "/favorites",
            },
        ],
    },
];
