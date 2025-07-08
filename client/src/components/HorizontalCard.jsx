import { formatToEST } from "../utils/formatDateEST";
import { decodeHtml, stripHtml } from "../utils/htmlUtils";

const HorizontalCard = ({ article }) => (
    <div className="mb-4 flex max-w-3xl flex-row overflow-hidden rounded bg-white shadow-lg">
        {article.image && (
            <img
                className="h-48 w-48 object-cover"
                src={article.image}
                alt="source"
            />
        )}
        <div className="flex-1 flex flex-col justify-between p-4">
            <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 text-xl font-bold hover:underline"
            >
                {article.title}
            </a>
            <p className="mb-2 text-gray-700 line-clamp-5">{decodeHtml(stripHtml(article.description))}</p>
            <div className="flex-row flex gap-2 text-sm text-gray-600">
                <span className="full mr-2 mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">{article.source}</span>
                <span className="full mr-2 mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">{formatToEST(article.published)}</span>
            </div>
        </div>
    </div>
);

export default HorizontalCard;
