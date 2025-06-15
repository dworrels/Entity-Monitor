import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./routes/layout";

import DashboardPage from "./routes/dashboard/page";

import ProjectPage from "./routes/projects/page";

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
                    path: "MyFeeds",
                    element: <h1 className="title">My Feeds</h1>,
                },
                {
                    path: "Projects",
                    element: <ProjectPage />,
                },
                {
                    path: "AddFeed",
                    element: <h1 className="title">Add Feed</h1>,
                }
            ],
        },
    ]);

    return <RouterProvider router={router} />;
}

export default App;
