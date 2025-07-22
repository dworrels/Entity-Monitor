import ProjectCard from "../../components/ProjectCard";
import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { useNavigate } from "react-router-dom";

const ProjectPage = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [showModal, setShowModal] = useState(false);
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState({ name: "", keyword: "" });
    const [editProject, setEditProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/projects`)
            .then((res) => res.json())
            .then((data) => setProjects(data));
    }, [API_BASE_URL]);

    const handleInputChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name || !form.keyword) return;
        if (editProject) {
            fetch(`${API_BASE_URL}/api/projects/${editProject.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...editProject, name: form.name, keyword: form.keyword }),
            })
                .then((res) => res.json())
                .then((updatedProject) => {
                    setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
                    setEditProject(null);
                    setForm({ name: "", keyword: "" });
                    setShowModal(false);
                });
        } else {
            fetch(`${API_BASE_URL}/api/projects`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
                .then((res) => res.json())
                .then((newProject) => {
                    setProjects([newProject, ...projects]);
                    setForm({ name: "", keyword: "" });
                    setShowModal(false);
                });
        }
    };

    const handleEdit = (project) => {
        setEditProject(project);
        setForm({ name: project.name, keyword: project.keyword });
        setShowModal(true);
    };

    const handleDelete = (project) => {
        setProjectToDelete(project);
        setShowConfirmModal(true);
    };

    const confirmDelete = () => {
        fetch(`${API_BASE_URL}/api/projects/${projectToDelete.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...editProject, name: form.name, keyword: form.keyword }),
            })
                .then((res) => res.json())
                .then((updatedProjects) => {
                    setProjects(updatedProjects);
                    setShowConfirmModal(false);
                    setProjectToDelete(null);
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
                        setEditProject(null);
                        setForm({ name: "", keyword: "" });
                    }}
                >
                    + Create Project
                </button>

                <Modal
                    isVisible={showModal}
                    onClose={() => {
                        setShowModal(false)
                        setEditProject(null);
                        setForm({ name: "", keyword: "" });
                    }}

                >
                    <div className="p-6">
                        <h3 className="mb-5 text-xl font-semibold text-gray-900">{editProject ? "Edit Project" : "Create New Project"}</h3>
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
                                {editProject ? "Update Project" : "Create Project"}
                            </button>
                        </form>
                    </div>
                </Modal>

                {/* Confirm Delete Modal */}
                <Modal
                    isVisible={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                >
                    <div className="p-6"> 
                        <h3 className="mb-4 text-lg font-semibold">Are you sure you want to delete?</h3>
                        <p className="mb-6 text-gray-700">{projectToDelete?.name}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="rounded bg-gray-300 px-4 py-2 text-gray-800"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                                onClick={confirmDelete}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        name={project.name}
                        keyword={project.keyword}
                        date={project.date}
                        onClick={() => navigate(`/Projects/${project.id}`)}
                        onEdit={() => handleEdit(project)}
                        onDelete={() => handleDelete(project)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProjectPage;
