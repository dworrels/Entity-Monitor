import { formatToEST } from "../utils/formatDateEST";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SocialCard = ({ post }) => {
    
    const shouldProxy =
        post.image &&
        (post.image.includes("instagram.") ||
         post.image.includes("cdninstagram") ||
         post.image.startsWith("https://scontent"));

    const imageSrc = shouldProxy
        ? `${API_BASE_URL}/api/proxy-image?url=${encodeURIComponent(post.image)}`
        : post.image;

    return (
        <div className="max-w-sm max-h-[620px] flex flex-col overflow-hidden rounded bg-white shadow-lg">
            {imageSrc && (
                <img 
                    className="w-full h-96 object-cover object-top"
                    src={imageSrc}
                    alt="social post"
                />
            )}
            <div className="px-6 py-4 flex-1 flex flex-col">
                {/* Only show username/link if available */}
                {post.username && (
    <a
        href={post.url || post.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 text-xl font-bold hover:underline"
    >
        @{post.username}
                    </a>
                )}
                <p className="text-base text-gray-700 overflow-hidden text-ellipsis line-clamp-5">
                    {post.text || post.caption || post.content}
                </p>
            </div>
            <div className="px-6 pt-4 pb-2 flex flex-col item-start gap-1">
                <span className="full mr-2 mb-2 inline-block rounded bg-gray-200 px-3 oy-1 text-sm font-semibold text-gray-700">
                    {formatToEST(post.taken_at || post.timestamp || post.created_at)}
                </span>
            </div>
        </div>
    );
};

export default SocialCard;