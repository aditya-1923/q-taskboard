import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type {
  ApiTask,
  ApiProjectMember,
  TaskStatus,
} from "@/types";
import { STATUS_LABELS, STATUS_ORDER } from "@/types";

type Props = {
  task: ApiTask;
  projectId: string;
  members: ApiProjectMember[];
  role: "admin" | "member" | "viewer";
  onClose: () => void;
};

export function TaskDetail({
  task,
  projectId,
  members,
  role,
  onClose,
}: Props) {
  const queryClient = useQueryClient();

  const canEdit = role === "admin" || role === "member";

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(
    task.description ?? ""
  );
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [assigneeId, setAssigneeId] = useState<string>(
    task.assigneeId ?? ""
  );
  const [error, setError] = useState<string | null>(null);

  const updateTask = useMutation({
    mutationFn: (input: Partial<ApiTask>) =>
      apiFetch<{ task: ApiTask }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project", projectId],
      });
      onClose();
    },
    onError: (err) =>
      setError(
        err instanceof Error ? err.message : "save failed"
      ),
  });

  const deleteTask = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: true }>(`/api/tasks/${task.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project", projectId],
      });
      onClose();
    },
    onError: (err) =>
      setError(
        err instanceof Error ? err.message : "delete failed"
      ),
  });

  function onSave() {
    if (!canEdit || updateTask.isPending) return;

    setError(null);

    updateTask.mutate({
      title,
      description,
      status,
      assigneeId: assigneeId || null,
    });
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-lg p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {canEdit ? "edit task" : "task details"}
          </h2>

          <button
            onClick={onClose}
            className="text-muted hover:text-white"
            aria-label="Close task details"
          >
            ✕
          </button>
        </div>

        <label className="block mb-3">
          <span className="text-xs text-muted">title</span>
          <input
            type="text"
            value={title}
            readOnly={!canEdit}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 block w-full rounded-md bg-bg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none read-only:opacity-70"
          />
        </label>

        <label className="block mb-3">
          <span className="text-xs text-muted">description</span>
          <textarea
            value={description}
            readOnly={!canEdit}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            rows={4}
            className="mt-1 block w-full rounded-md bg-bg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none read-only:opacity-70"
          />
        </label>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="text-xs text-muted">status</span>
            <select
              value={status}
              disabled={!canEdit}
              onChange={(event) =>
                setStatus(event.target.value as TaskStatus)
              }
              className="mt-1 block w-full rounded-md bg-bg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none disabled:opacity-70"
            >
              {STATUS_ORDER.map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABELS[item]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-muted">assignee</span>
            <select
              value={assigneeId}
              disabled={!canEdit}
              onChange={(event) =>
                setAssigneeId(event.target.value)
              }
              className="mt-1 block w-full rounded-md bg-bg border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none disabled:opacity-70"
            >
              <option value="">unassigned</option>

              {members.map((member) => (
                <option
                  key={member.user.id}
                  value={member.user.id}
                >
                  {member.user.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p
            className="text-sm text-red-400 mb-3"
            role="alert"
          >
            {error}
          </p>
        )}

        {!canEdit && (
          <p className="text-xs text-muted mb-3">
            You have read-only access to this task.
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          {canEdit ? (
            <button
              onClick={() => {
                if (!deleteTask.isPending) {
                  setError(null);
                  deleteTask.mutate();
                }
              }}
              disabled={
                deleteTask.isPending || updateTask.isPending
              }
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              {deleteTask.isPending ? "deleting…" : "delete task"}
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-md border border-border hover:border-muted"
            >
              {canEdit ? "cancel" : "close"}
            </button>

            {canEdit && (
              <button
                onClick={onSave}
                disabled={
                  updateTask.isPending || deleteTask.isPending
                }
                className="text-sm px-4 py-2 rounded-md bg-accent text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {updateTask.isPending ? "saving…" : "save"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
