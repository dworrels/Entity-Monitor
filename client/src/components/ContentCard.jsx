import { formatToEST } from "../utils/formatDateEST";
import { decodeHtml, stripHtml } from "../utils/htmlUtils";

const ContentCard = ({article}) => {

    const isBrandfetch = article.image && article.image.includes("brandfetch.io");

    
    return (
        <div className="max-w-sm max-h-[620px] flex flex-col overflow-hidden rounded bg-white shadow-lg">
            {article.image && (
                <img
                    className={
                        isBrandfetch
                            ? "w-full h-100 object-contain bg-white" // h-20 = 80px, adjust as needed
                            : "w-full h-50 object-cover"
                    }
                    src={article.image}
                    alt="source"
                    style={isBrandfetch ? { maxHeight: "200px", maxWidth: "100%", margin: "0 auto", display: "block" } : {}}
                />
            )}
            <div className="px-6 py-4 flex-1 flex flex-col">
                <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2 text-xl font-bold hover:underline"
                >
                    {article.title}
                </a>
                <p className="text-base text-gray-700 overflow-hidden text-ellipsis line-clamp-5">
                    {decodeHtml(stripHtml(article.description))}
                </p>
            </div>
            <div className="px-6 pt-4 pb-2 flex flex-col item-start gap-1">
                <span className="full mr-2 mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">{article.source}</span>
                <span className="full mr-2 mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">{formatToEST(article.published)}</span>
            </div>
        </div>
    );
};

export default ContentCard;


