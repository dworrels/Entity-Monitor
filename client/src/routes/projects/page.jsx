import ProjectCard from "../../components/ProjectCard";

const ProjectPage = () => {
    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex flex-row gap-x-28">
                <h1 className="title">Projects</h1>
                <button className="flex h-[40px] w-40 items-center justify-center rounded-lg border-0 border-slate-500 bg-blue-500 p-3 text-slate-100 transition-colors hover:bg-blue-600">
                    + Create Project
                </button>
            </div>
            <div className="flex flex-row gap-x-2 ">
                <ProjectCard />
                <ProjectCard />
                <ProjectCard />
                <ProjectCard />
            </div>
        </div>
    );
};

export default ProjectPage;
