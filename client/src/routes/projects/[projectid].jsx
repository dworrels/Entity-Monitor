import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { matchesBooleanSearch } from "../../utils/booleanSearch";
import ContentCard from "../../components/ContentCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ProjectDetailPage = () => {
    const { projectid } = useParams();
    const [project, setProject] = useState(null);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

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
            <h1 className="mb-4 text-2xl font-bold">{project.name}</h1>
            <p className="mb-2 text-gray-700">Keyword: {project.keyword}</p>
            <h2 className="mt-6 mb-2 text-xl font-semibold">Articles</h2>
            <ul>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredArticles.map((article, idx) => (
                        <ContentCard
                            key={idx}
                            article={article}
                        />
                    ))}
                </div>
            </ul>
            {filteredArticles.length === 0 && <div>NO articles match this project's keyword.</div>}
        </div>
    );
};

export default ProjectDetailPage;
