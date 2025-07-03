import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { matchesBooleanSearch } from "../../utils/booleanSearch";
import ContentCard from "../../components/ContentCard";
import HorizontalCard from "../../components/HorizontalCard";
import { Settings } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ProjectDetailPage = () => {
    const { projectid } = useParams();
    const [project, setProject] = useState(null);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listView, setListView] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/projects`)
            .then((res) => res.json())
            .then((data) => {
                const found = data.find((p) => p.id === projectid);
                setProject(found);
            });

        fetch(`${API_BASE_URL}/api/articles`)
            .then((res) => res.json())
            .then((data) => setArticles(data))
            .finally(() => setLoading(false));
    }, [projectid]);

    if (loading) return <div>Loading...</div>;
    if (!project) return <div>Project not found</div>;

    const filteredArticles = articles.filter((article) =>
        matchesBooleanSearch((article.title || "") + " " + (article.description || ""), project.keyword),
    );

    return (
        <div className="p-6">
            <div className="mb-4 flex items-center">
                <h1 className="mb-4 text-2xl font-bold">{project.name}</h1>
                <button className="ml-auto">
                    <Settings />
                </button>
            </div>
            <p className="mb-2">
                <span className="mx-2 inline-block rounded bg-blue-100 px-2 py-1 font-medium">Search Query: {project.keyword}</span>
            </p>
            <div className="mb-4 flex items-center">
                <h2 className="mt-6 mb-2 text-xl font-semibold">Articles</h2>
                <button
                    className="ml-auto rounded bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300"
                    onClick={() => setListView((v) => !v)}
                >
                    {listView ? "Card View" : "List View"}
                </button>
            </div>
            {listView ? (
                <div>
                    {filteredArticles.map((article, idx) => (
                        <HorizontalCard
                            key={idx}
                            article={article}
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredArticles.map((article, idx) => (
                        <ContentCard
                            key={idx}
                            article={article}
                        />
                    ))}
                </div>
            )}
            {filteredArticles.length === 0 && <div>NO articles match this project's keyword.</div>}
        </div>
    );
};

export default ProjectDetailPage;
