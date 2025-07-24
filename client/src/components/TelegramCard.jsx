const TelegramCard = ({ result }) => (
    <div className="max-w-sm max-h-[320px] flex flex-col overflow-hidden rounded bg-white shadow-lg p-6">
        <span className="mb-2 text-xl font-bold text-blue-700">
            {result.title}
        </span>
        {result.username && (
            <a
                href={`https://t.me/${result.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 text-base font-semibold hover:underline text-blue-600"
            >
                @{result.username}
            </a>
        )}
        <span className="text-sm text-gray-700 mb-2">
            Participants: {result.participantsCount ?? "N/A"}
        </span>
    </div>
);

export default TelegramCard;