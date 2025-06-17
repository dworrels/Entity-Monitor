import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./routes/layout";

import DashboardPage from "./routes/dashboard/page";

import ProjectPage from "./routes/projects/page";
import RSSFeedsPage from "./routes/rssfeeds/page";

/* Main App component that sets up the router and routes */
function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Layout />,
            children: [
                {
                    index: true,
                    element: <DashboardPage />,
                },
                {
                    path: "RSSFeeds",
                    element: <RSSFeedsPage />,
                },
                {
                    path: "Projects",
                    element: <ProjectPage />,
                },
                {
                    path: "favorites",
                    element: <h1 className="title">Favorites</h1>,
                },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
}

export default App;
