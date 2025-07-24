import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { matchesBooleanSearch } from "../../utils/booleanSearch";
import ContentCard from "../../components/ContentCard";
import HorizontalCard from "../../components/HorizontalCard";
import { Settings, Search } from "lucide-react";
import SocialCard from "../../components/SocialCard";
import YouTubeCard from "../../components/YouTubeCard";
import ForumsCard from "../../components/ForumsCard";
import TelegramCard from "../../components/TelegramCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SOCIAL_SITES = [
    { label: "Instagram", value: "instagram" },
    { label: "X", value: "x" },
    { label: "Facebook", value: "facebook" },
    { label: "LinkedIn", value: "linkedin" },
    { label: "YouTube", value: "youtube" },
];

const ProjectDetailPage = () => {
    const { projectid } = useParams();
    const [project, setProject] = useState(null);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listView, setListView] = useState(false);
    const [activeTab, setActiveTab] = useState("articles");
    const [redditResults, setRedditResults] = useState([]);
    const [redditLoading, setRedditLoading] = useState(false);

    // social tab state
    const [socialSearch, setSocialSearch] = useState("");
    const [selectedSite, setSelectedSite] = useState(SOCIAL_SITES[0].value);
    const [socialResults, setSocialResults] = useState([]);
    const [socialLoading, setSocialLoading] = useState(false);

    // forums search
    const [forumsSearch, setForumsSearch] = useState(project?.keyword || "");
    const [forumsSubreddit, setForumsSubreddit] = useState("");
    const [forumsSearched, setForumsSearched] = useState(false);

    // daily report
    const [dailyReport, setDailyReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    const [telegramResults, setTelegramResults] = useState([]);
    const [telegramSearch, setTelegramSearch] = useState("");
    const [telegramLoading, setTelegramLoading] = useState(false);

    const filteredArticles = useMemo(
        () => articles.filter((article) => matchesBooleanSearch((article.title || "") + " " + (article.description || ""), project?.keyword)),
        [articles, project?.keyword],
    );

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

    // Start of social tab
    const handleSocialSearch = (e) => {
        e.preventDefault();
        setSocialLoading(true);

        let url = "";
        if (selectedSite === "instagram") {
            url = `${API_BASE_URL}/api/instagram/posts?username=${encodeURIComponent(socialSearch)}`;
        } else if (selectedSite === "x") {
            url = `${API_BASE_URL}/api/x/posts?query=${encodeURIComponent(socialSearch)}`;
        } else if (selectedSite === "facebook") {
            url = `${API_BASE_URL}/api/facebook/posts?query=${encodeURIComponent(socialSearch)}`;
        } else if (selectedSite === "linkedin") {
            url = `${API_BASE_URL}/api/linkedin/posts?query=${encodeURIComponent(socialSearch)}`;
        } else if (selectedSite === "youtube") {
            url = `${API_BASE_URL}/api/youtube/videos?query=${encodeURIComponent(socialSearch)}`;
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

    useEffect(() => {
        // Autofill the search bar with the search query when X is selected
        if ((selectedSite === "x" || selectedSite === "linkedin" || selectedSite === "facebook" || selectedSite === "youtube") && project?.keyword) {
            setSocialSearch(project.keyword);
        }
    }, [selectedSite, project?.keyword]);

    // Start of forums tab
    useEffect(() => {
        setForumsSearch(project?.keyword || "");
    }, [project]);

    const handleForumsSearch = (e) => {
        e.preventDefault();
        setRedditLoading(true);
        setForumsSearched(true);
        let url = `${API_BASE_URL}/api/reddit?query=${encodeURIComponent(forumsSearch)}`;
        if (forumsSubreddit) {
            url += `&subreddit=${encodeURIComponent(forumsSubreddit)}`;
        }
        fetch(url)
            .then((res) => res.json())
            .then((data) => setRedditResults(data.posts || []))
            .finally(() => setRedditLoading(false));
    };

    const articleLinks = useMemo(() => filteredArticles.map((a) => a.link), [filteredArticles]);

    const handleTelegramSearch = (e) => {
        e.preventDefault();
        setTelegramLoading(true);
        fetch(`${API_BASE_URL}/api/telegram/search?query=${encodeURIComponent(telegramSearch)}`)
            .then((res) => res.json())
            .then((data) => setTelegramResults(data.results || []))
            .finally(() => setTelegramLoading(false));
    };

    const CHAT_SOURCES = [
        { label: "Telegram", value: "telegram" },
        // Add more chat sources here if needed
    ];

    const [selectedChatSource, setSelectedChatSource] = useState(CHAT_SOURCES[0].value);

    // Fetch daily report when the reports tab is active
    useEffect(() => {
        if (activeTab === "reports" && project && articleLinks.length > 0) {
            setReportLoading(true);
            fetch(`${API_BASE_URL}/api/projects/${project.id}/daily_report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    article_links: articleLinks,
                }),
            })
                .then((res) => res.json())
                .then((data) => setDailyReport(data))
                .finally(() => setReportLoading(false));
        }
    }, [activeTab, project, articleLinks]);

    if (loading) return <div>Loading...</div>;
    if (!project) return <div>Project not found</div>;

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
                    className={`px-4 font-semibold ${activeTab === "Forums" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => setActiveTab("Forums")}
                >
                    Forums
                </button>
                <button
                    className={`px-4 font-semibold ${activeTab === "Chats" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => setActiveTab("Chats")}
                >
                    Chats
                </button>
                <button
                    className={`px-4 font-semibold ${activeTab === "reports" ? "border-b-2 border-blue-500" : ""}`}
                    onClick={() => setActiveTab("reports")}
                >
                    Reports
                </button>
            </div>

            {/* Articles tab content */}
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

                    {filteredArticles.length === 0 && <div>No articles match this project's keyword.</div>}
                </>
            )}

            {/* Social Media tab content */}
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
                            {selectedSite === "youtube"
                                ? socialResults.map((result, idx) => (
                                      <YouTubeCard
                                          key={idx}
                                          post={result}
                                      />
                                  ))
                                : socialResults.map((result, idx) => (
                                      <SocialCard
                                          key={idx}
                                          post={result}
                                      />
                                  ))}
                        </div>
                    )}
                </div>
            )}
            {activeTab === "Forums" && (
                <div>
                    <form
                        className="mb-6 flex items-center gap-2"
                        onSubmit={handleForumsSearch}
                    >
                        <div className="relative flex-1">
                            <Search
                                className="absolute top-1/2 left-2 -translate-y-1/2 text-slate-400"
                                size={18}
                            />
                        </div>
                        <input
                            type="text"
                            className="w-full rounded border border-slate-300 py-2 pl-8"
                            placeholder="Search Reddit..."
                            value={forumsSearch}
                            onChange={(e) => setForumsSubreddit(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
                            disabled={redditLoading}
                        >
                            {redditLoading ? "Searching..." : "Search"}
                        </button>
                    </form>
                    {redditLoading && <div>Loading Reddit posts...</div>}
                    {!redditLoading && forumsSearched && redditResults.length === 0 && <div>No Reddit posts found for this query.</div>}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {redditResults.map((post, idx) => (
                            <ForumsCard
                                key={idx}
                                post={post}
                            />
                        ))}
                    </div>
                </div>
            )}
            {activeTab === "reports" && (
                <div>
                    {reportLoading && <div>Loading daily report...</div>}
                    {!reportLoading && dailyReport && (
                        <div className="prose max-w-none rounded bg-white p-6 shadow">
                            <h2 className="mb-2 text-xl font-bold">
                                {dailyReport.project} Daily Report ({dailyReport.date})
                            </h2>
                            <div className="mb-4 text-gray-600">{dailyReport.article_count} articles summarized</div>
                            <div className="whitespace-pre-line">{dailyReport.report}</div>
                            {/* Optionally show summaries for each article */}
                            <details className="mt-6">
                                <summary className="cursor-pointer text-blue-600">Show individual article summaries</summary>
                                <div className="mt-2 text-sm whitespace-pre-line">
                                    {dailyReport.summaries &&
                                        dailyReport.summaries.map((s, i) => (
                                            <div
                                                key={i}
                                                className="mb-4"
                                            >
                                                {s}
                                            </div>
                                        ))}
                                </div>
                            </details>
                        </div>
                    )}
                    {!reportLoading && dailyReport && dailyReport.message && <div>{dailyReport.message}</div>}
                    {!reportLoading && !dailyReport && <div>No daily report available.</div>}
                </div>
            )}
            {activeTab === "Chats" && !reportLoading && !dailyReport && (
                <div>
                    <h2 className="mb-2 text-xl font-bold">Chat Search</h2>
                    <form
                        className="mb-6 flex items-center gap-2"
                        onSubmit={handleTelegramSearch}
                    >
                        <input
                            type="text"
                            className="w-full rounded border border-slate-300 py-2 pl-4"
                            placeholder={`Search ${selectedChatSource === "telegram" ? "Telegram username or channel..." : "Chats..."}`}
                            value={telegramSearch}
                            onChange={(e) => setTelegramSearch(e.target.value)}
                        />
                        <select
                            className="rounded border border-slate-300 bg-white px-3 py-2"
                            value={selectedChatSource}
                            onChange={(e) => setSelectedChatSource(e.target.value)}
                        >
                            {CHAT_SOURCES.map((source) => (
                                <option
                                    key={source.value}
                                    value={source.value}
                                >
                                    {source.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
                            disabled={telegramLoading}
                        >
                            {telegramLoading ? "Searching..." : "Search"}
                        </button>
                    </form>
                    {telegramLoading && <div>Loading Telegram results...</div>}
                    {!telegramLoading && telegramResults.length === 0 && <div>No Telegram results found.</div>}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {selectedChatSource === "telegram" &&
                            telegramResults.map((result, idx) => (
                                <TelegramCard
                                    key={idx}
                                    result={result}
                                />
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetailPage;
