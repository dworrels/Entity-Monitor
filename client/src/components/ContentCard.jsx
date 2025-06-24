// converts HTML entities (like &quot;, &apos;, &amp;) into their corresponding characters (", ', &).
const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

// Remove HTML Tags such as <p> or <div>
function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

const ContentCard = ({article}) => {
    return (
        <div className="max-w-sm max-h-[620px] flex flex-col overflow-hidden rounded bg-white shadow-lg">
            {article.image && <img
                className="w-full h-50 object-cover"
                src={article.image}
                alt="source"
            />}
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
            <div className="px-6 pt-4 pb-2">
                <span className="full mr-2 mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">{article.source}</span>
                <span className="full mr-2 mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">{article.published}</span>
            </div>
        </div>
    );
};

export default ContentCard;
