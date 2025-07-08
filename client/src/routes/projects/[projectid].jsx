import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { matchesBooleanSearch } from "../../utils/booleanSearch";
import ContentCard from "../../components/ContentCard";
import HorizontalCard from "../../components/HorizontalCard";
import { Settings, Search } from "lucide-react";
import SocialCard from "../../components/SocialCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SOCIAL_SITES = [
    { label: "Instagram", value: "instagram" },
    { label: "X", value: "x" },
    { label: "Facebook", value: "facebook" },
];

const ProjectDetailPage = () => {
    const { projectid } = useParams();
    const [project, setProject] = useState(null);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listView, setListView] = useState(false);
    const [activeTab, setActiveTab] = useState("articles");

    // social tab state
    const [socialSearch, setSocialSearch] = useState("");
    const [selectedSite, setSelectedSite] = useState(SOCIAL_SITES[0].value);
    const [socialResults, setSocialResults] = useState([]);
    const [socialLoading, setSocialLoading] = useState(false);

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

    const handleSocialSearch = (e) => {
    e.preventDefault();
    setSocialLoading(true);

    let url = "";
    if (selectedSite === "instagram") {
        url = `${API_BASE_URL}/api/instagram/posts`;
    } else {
        url = `${API_BASE_URL}/api/social?site=${selectedSite}&username=${encodeURIComponent(socialSearch)}`;
    }

    fetch(url)
        .then((res) => res.json())
        .then((data) => {
            setSocialResults(data.posts || []);
        })
        .finally(() => setSocialLoading(false));
};

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
            <p className="mb-6">
                <span className="mx-2 inline-block rounded bg-blue-100 px-2 py-1 font-medium">Search Query: {project.keyword}</span>
            </p>

            {/* Tabs */}
            <div className="mb-2 flex border-b">
                <button
                    className={`px-4 font-semibold ${activeTab === "articles" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => setActiveTab("articles")}
                >
                    Articles
                </button>
                <button
                    className={`px-4 font-semibold ${activeTab === "social" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => setActiveTab("social")}
                >
                    Social Media
                </button>
                <button
                    className={`px-4 font-semibold ${activeTab === "forums" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => setActiveTab("forums")}
                >
                    Forums
                </button>
                <button
                    className={`px-4 font-semibold ${activeTab === "reports" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => setActiveTab("reports")}
                >
                    Reports
                </button>
            </div>

            {activeTab === "articles" && (
                <>
                    <div className="mb-4 flex items-center">
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
                </>
            )}

            {/* Tabs content */}
            {activeTab === "social" && (
                <div>
                    <form
                        className="mb-6 flex items-center gap-2"
                        onSubmit={handleSocialSearch}
                    >
                        <div className="relative flex-1">
                            <Search
                                className="absolute top-1/2 left-2 -translate-y-1/2 text-slate-400"
                                size={18}
                            />
                            <input
                                type="text"
                                className="pr--32 w-full rounded border border-slate-300 py-2 pl-8"
                                placeholder="Search for username..."
                                value={socialSearch}
                                onChange={(e) => setSocialSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="rounded border border-slate-300 bg-white px-3 py-2"
                            value={selectedSite}
                            onChange={(e) => setSelectedSite(e.target.value)}
                        >
                            {SOCIAL_SITES.map((site) => (
                                <option
                                    key={site.value}
                                    value={site.value}
                                >
                                    {site.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
                            disabled={socialLoading}
                        >
                            {socialLoading ? "Searching..." : "Search"}
                        </button>
                    </form>

                    {socialResults.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {socialResults.map((result, idx) => (
                                <SocialCard
                                    key={idx}
                                    post={result}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
            {activeTab === "forums" && (
                <div>
                    <div className="mt-8 text-gray-500">Forums content here</div>
                </div>
            )}
            {activeTab === "reports" && (
                <div>
                    <div className="mt-8 text-gray-500">Reports content here</div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetailPage;
