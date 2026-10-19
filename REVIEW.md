
## 1. Task updates were not authorization-checked

- **File:** `backend/projects/views.py`
- **Location:** `TaskDetailView.patch()` — **line TBD**
- **Category:** Security / Broken access control
- **Severity:** **Critical**

The original `patch()` implementation fetched a task by ID without checking whether the authenticated user belonged to that task's project or had a role allowed to edit tasks. A project viewer could modify task data through a direct API request. Scope the lookup to projects the user can access and enforce the role policy before saving; return `403 Forbidden` when the user lacks permission.

**Evidence before fix:** An authenticated viewer's `PATCH` request returned `HTTP 200` and changed the task.

**Evidence after fix:** The same viewer request returns `HTTP 403` with:

```json
{"error": "You do not have permission to update tasks"}
```

**Regression test:** `backend/projects/tests.py` — `test_viewers_cannot_update_tasks`.

Example request (replace placeholders with a local task ID and viewer token):

```bash
curl -i -X PATCH "http://localhost:8000/api/tasks/TASK_ID" \\
  -H "Authorization: Bearer VIEWER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d "{\"title\":\"Unauthorized change\"}"
```

Expected after the fix: `403 Forbidden`. Never commit or share access tokens.


## 2. Unsafe Django security defaults

- **File:** `backend/taskboard/settings.py` — exact lines TBD
- **Category:** Security / Configuration
- **Severity:** **High**

The settings observed during review used a development fallback for `SECRET_KEY`, defaulted `DEBUG` to `true`, allowed all hosts (`ALLOWED_HOSTS = ['*']`), and permitted all CORS origins. These defaults are unsafe in a deployed environment: a known secret weakens signing security, debug mode can expose diagnostic details, and broad host/CORS settings unnecessarily widen the attack surface. Require secrets through environment variables, fail startup when production secrets are missing, restrict hosts and CORS to deployment domains, and enable Django security middleware and appropriate production settings.

## 3. Airtable export did not perform a real export in the original implementation

- **File:** `backend/projects/views.py`
- **Location:** `ExportView.post()` — original implementation; exact line TBD
- **Category:** Functional correctness / Incomplete feature
- **Severity:** **High** (assignment requirement)

The original endpoint returned an export-shaped response without creating records in Airtable, so a successful HTTP response could mislead the caller into thinking data had been exported. Implement the server-side Airtable API call, keep credentials on the backend, authorize project roles, handle individual record failures without aborting the batch, and make repeated exports idempotent by tracking task IDs already present in Airtable.

**Verification after implementation:** The first successful run returned `{"exported":1,"skipped":6,"failed_task_ids":[]}` and the next returned `{"exported":0,"skipped":7,"failed_task_ids":[]}`. Confirm records in the Airtable UI and ensure the skip count is calculated explicitly and accurately.

## 4. Frontend task controls were not aligned with role permissions

- **Files:** `frontend/src/.../TaskDetail.tsx` and `frontend/src/.../ProjectPage.tsx` — confirm exact paths and lines
- **Category:** Authorization UX / Functional consistency
- **Severity:** **Medium**

The task detail UI displayed edit/delete controls without consistently gating them by project role, and the project page rendered the create-task form for roles that should be read-only. This creates confusing controls for viewers and leads to requests the backend should reject. Pass the current membership role into these components and hide or disable write controls for viewers; backend permission checks must remain authoritative because frontend checks alone are not security.

## Review summary

| Priority | Finding | Severity | Recommended action |
|---|---|---|---|
| 1 | Missing authorization on task PATCH | Critical | Enforce project membership and role checks; add regression test |
| 2 | Unsafe Django security defaults | High | Require production secrets; restrict hosts, CORS, and debug settings |
| 3 | Airtable export was a no-op in the original implementation | High | Add real server-side export, authorization, failure handling, and idempotency |
| 4 | Frontend write controls were not role-aware | Medium | Align UI controls with membership roles and retain backend enforcement |

## Notes before submission

- Replace all `line TBD` entries and confirm frontend paths against the repository.
- Keep before-fix and after-fix curl outputs in `TERMINAL_LOG.md`; redact bearer tokens.
- Ensure the final test results and real Airtable proof in `TERMINAL_LOG.md` match the latest run.
