const ForumsCard = ({ post }) => (
    <div className="rounded shadow bg-white p-4 flex flex-col h-full">
        <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-bold hover:underline mb-2"
        >
            {post.title}
        </a>
        <div className="text-sm text-gray-500 mb-2">
            <span>r/{post.subreddit}</span> &middot; <span>u/{post.user}</span>
        </div>
        <div className="text-gray-700 text-base line-clamp-5">{post.selftext}</div>
    </div>
)

export default ForumsCard;