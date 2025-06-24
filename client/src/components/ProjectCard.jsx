import React from "react";

const ProjectCard = () => {
    return (
        <div className="min-w-82 overflow-hidden rounded bg-white shadow-lg">
            <div className="px-6 py-4">
                <div className="mb-2 text-xl font-bold">Project Name</div>
                <p className="text-base text-gray-700">Project Description</p>
            </div>
            <div className="px-6 pt-4 pb-2">
                <span className="full mr-2 mb-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">Date Created</span>
            </div>
        </div>
    );
};

export default ProjectCard;
