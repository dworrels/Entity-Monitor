const YouTubeCard = ({ post }) => (
    <div className="max-w-sm max-h-[620px] flex flex-col overflow-hidden rounded bg-white shadow-lg">
        {post.thumbnail && (
            <div className="w-full aspect-video bg-gray-100">
                <img
                    className="w-full h-full object-cover object-top"
                    src={post.thumbnail}
                    alt={post.title}
                />
            </div>
        )}
        <div className="px-6 py-4 flex-1 flex flex-col">
            <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 text-xl font-bold hover:underline"
            >
                {post.title}
            </a>
        </div>
        <div className="px-6 pt-4 pb-2 flex flex-col item-start gap-1">
            <span className="mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">
                {post.channel}
            </span>
            <span className="mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">
                {new Date(post.date).toLocaleDateString()}
            </span>
        </div>
    </div>
);

export default YouTubeCard;