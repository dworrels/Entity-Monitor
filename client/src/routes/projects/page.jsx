import ProjectCard from "../../components/ProjectCard";
import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { useNavigate } from "react-router-dom";

const ProjectPage = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    const [showModal, setShowModal] = useState(false);
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState({name: "", keyword: ""})
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/projects`)
        .then(res => res.json())
        .then(data => setProjects(data));

    }, [API_BASE_URL]);     

    const handleInputChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = (e) =>  {
        e.preventDefault();
        if (!form.name || !form.keyword) return;
        fetch(`${API_BASE_URL}/api/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        })
            .then(res => res.json())
            .then(newProject => {
                setProjects([...projects, newProject]);
                setForm({ name: "", keyword: ""});
                setShowModal(false);
            });
    };

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex flex-row gap-x-20">
                <h1 className="title">Projects</h1>
                <button
                    className="flex h-[40px] w-40 items-center justify-center rounded-lg border-0 border-slate-500 bg-blue-500 p-3 text-slate-100 transition-colors hover:bg-blue-600 ml-auto"
                    onClick={() => {
                        setShowModal(true);
                    }}
                >
                    + Create Project
                </button>

                <Modal
                    isVisible={showModal}
                    onClose={() => setShowModal(false)}
                >
                    <div className="p-6">
                        <h3 className="mb-5 text-xl font-semibold text-gray-900">Create New Project</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">Project Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleInputChange}
                                    className="w-full rounded border border-gray-300 p-2"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-700">Search Query</label>
                                <input
                                    type="text"
                                    name="keyword"
                                    value={form.keyword}
                                    onChange={handleInputChange}
                                    className="w-full rounded border border-gray-300 p-2"
                                />
                            </div>

                            <button
                                type="submit"
                                className="rounded bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600"
                            >
                                Create Project
                            </button>
                        </form>
                    </div>
                </Modal>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        name={project.name}
                        keyword={project.keyword}
                        date={project.date}
                        onClick={() => navigate(`/Projects/${project.id}`)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProjectPage;
