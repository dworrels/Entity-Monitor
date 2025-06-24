import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ContentCard from "../../components/ContentCard";

const PAGE_SIZE = 8;

const DashboardPage = () => {
    const [articles, setArticles] = useState([]);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const { search, scrollContainerRef } = useOutletContext();

    // Filter Articles by search
    const filteredArticles = articles.filter(article =>
        (article.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (article.description || "").toLowerCase().includes(search.toLowerCase())
    );

    // Keep refs for latest values
    const visibleCountRef = useRef(visibleCount);
    const filteredLengthRef = useRef(filteredArticles.length);

    useEffect(() => {
        visibleCountRef.current = visibleCount;
    }, [visibleCount]);
    useEffect(() => {
        filteredLengthRef.current = filteredArticles.length;
    }, [filteredArticles.length]);

    // Reset visibleCount when articles or search changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [articles, search]);

    useEffect(() => {
        setLoading(true);
        fetch("http://192.168.5.49:8090/api/articles")
            .then(res => res.json())
            .then(data => {
                setArticles(data);
                setLoading(false);
            });
    }, []);

    // Infinite scroll: load more on scroll
    useEffect(() => {
        const container = scrollContainerRef?.current;
        if (!container) return;

        const handleScroll = () => {
            if (
                container.scrollTop + container.clientHeight >= container.scrollHeight - 200 &&
                visibleCountRef.current < filteredLengthRef.current
            ) {
                setVisibleCount(v => v + PAGE_SIZE);
            }
        };
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [scrollContainerRef]); // Register ONCE

    return (
        <div className="flex flex-col gap-y-4">
            <h1 className="title">Latest Updates</h1>
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(PAGE_SIZE)].map((_, i) => (
                        <div key={i} className="animate-pulse max-w-sm h-[320px] bg-gray-200 rounded" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredArticles.slice(0, visibleCount).map((article, idx) => (
                        <ContentCard key={idx} article={article} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;