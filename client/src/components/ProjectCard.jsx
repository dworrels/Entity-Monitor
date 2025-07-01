import { Bell } from 'lucide-react'

const ProjectCard = ({ name, keyword, date}) => {
    return (
        <div className="min-w-82 overflow-hidden rounded bg-white shadow-lg hover:opacity-75 hover:shadow">
            <div className="px-6 py-4">
                <div className="justify-items-end text-gray-500">
                    <Bell size={20} />
                </div>
                <div className="mb-2 text-xl font-bold">{name}</div>
                <p className="text-base text-gray-700">{keyword}</p>
            </div>
            <div className="px-6 pt-4 pb-2">
                <span className="full mr-2 mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">{date}</span>
            </div>
        </div>
    );
};

export default ProjectCard;
