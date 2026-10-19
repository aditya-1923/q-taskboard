import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getToken } from "@/lib/api-client";
import { Header } from "@/components/Header";
import { StatusColumn } from "@/components/StatusColumn";
import { TaskDetail } from "@/components/TaskDetail";
import type { ApiProjectDetail, ApiTask, TaskStatus } from "@/types";
import { STATUS_ORDER } from "@/types";

export default function ProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTask, setActiveTask] = useState<ApiTask | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newColumn, setNewColumn] = useState<TaskStatus>("todo");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) navigate("/login", { replace: true });
  }, [navigate]);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () =>
      apiFetch<{ user: { id: string | number } }>("/api/users/me"),
    enabled: Boolean(getToken()),
  });

  const {
    data,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () =>
      apiFetch<{ project: ApiProjectDetail }>(`/api/projects/${id}`),
    enabled: Boolean(id && getToken()),
  });

  const project = data?.project;
  const currentUserId = meData?.user.id;

  const currentMembership = project?.memberships.find(
    (membership) =>
      String(membership.user.id) === String(currentUserId)
  );

  const currentUserRole = currentMembership?.role;

  const canManageTasks =
    currentUserRole === "admin" || currentUserRole === "member";

  const createTask = useMutation({
    mutationFn: (input: { title: string; status: TaskStatus }) =>
      apiFetch<{ task: ApiTask }>(`/api/projects/${id}/tasks`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      setNewTitle("");
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "create failed"),
  });

  const tasksByStatus: Record<TaskStatus, ApiTask[]> = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };

  if (project) {
    for (const task of project.tasks) {
      tasksByStatus[task.status].push(task);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Link
          to="/dashboard"
          className="text-sm text-muted hover:text-white"
        >
          ← all projects
        </Link>

        {isLoading && (
          <p className="text-muted text-sm mt-6">loading…</p>
        )}

        {queryError && (
          <p className="text-sm text-red-400 mt-6">
            {queryError instanceof Error
              ? queryError.message
              : "failed to load"}
          </p>
        )}

        {project && (
          <>
            <div className="flex items-start justify-between mt-4 mb-8">
              <div>
                <h1 className="text-2xl font-semibold">
                  {project.name}
                </h1>

                {project.description && (
                  <p className="text-sm text-muted mt-1 max-w-2xl">
                    {project.description}
                  </p>
                )}

                <p className="text-xs text-muted mt-2">
                  owner: {project.owner.name} ·{" "}
                  {project.memberships.length} members
                </p>
              </div>
            </div>

            {canManageTasks && (
              <section className="bg-surface border border-border rounded-lg p-4 mb-6">
                <h2 className="text-sm font-medium mb-3">
                  add a task
                </h2>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();

                    if (!newTitle.trim()) return;

                    setError(null);

                    createTask.mutate({
                      title: newTitle.trim(),
                      status: newColumn,
                    });
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(event) =>
                      setNewTitle(event.target.value)
                    }
                    placeholder="task title"
                    className="flex-1 rounded-md bg-bg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />

                  <select
                    value={newColumn}
                    onChange={(event) =>
                      setNewColumn(event.target.value as TaskStatus)
                    }
                    className="rounded-md bg-bg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  >
                    {STATUS_ORDER.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={createTask.isPending}
                    className="bg-accent hover:bg-indigo-500 text-white text-sm font-medium rounded-md px-4 disabled:opacity-50"
                  >
                    {createTask.isPending ? "adding…" : "add"}
                  </button>
                </form>

                {error && (
                  <p
                    className="text-sm text-red-400 mt-2"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </section>
            )}

            {!canManageTasks && currentUserRole && (
              <p className="text-sm text-muted mb-6">
                You have read-only access to this project.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATUS_ORDER.map((status) => (
                <StatusColumn
                  key={status}
                  status={status}
                  tasks={tasksByStatus[status]}
                  onTaskClick={setActiveTask}
                />
              ))}
            </div>

            <section className="mt-10">
              <h2 className="text-sm font-medium mb-3">
                members
              </h2>

              <ul className="bg-surface border border-border rounded-lg divide-y divide-border">
                {project.memberships.map((membership) => (
                  <li
                    key={membership.id}
                    className="px-4 py-3 flex items-center justify-between text-sm"
                  >
                    <span>{membership.user.name}</span>

                    <span className="text-xs text-muted">
                      {membership.user.email} · {membership.role}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>

      {activeTask && project && currentUserRole && (
        <TaskDetail
          task={activeTask}
          projectId={id!}
          members={project.memberships}
          role={currentUserRole}
          onClose={() => setActiveTask(null)}
        />
      )}
    </div>
  );
}
