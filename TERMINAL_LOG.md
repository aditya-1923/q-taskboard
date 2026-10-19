TaskBoard Terminal Log

1. Initial setup
. Started the project using Docker Compose
. Applied Django migrations and loaded seed data.
. Verify the dashboard at "http://localhost:3000".

2. Initial backend tests
Commadand: docker-compose exec backend python -m pytest
Result: 15 passed, 16 warnings in 29.35s 

3. Initial frontend tests
Commadand: docker-compose exec frontend npm test
Result: 2 test files passed, 9 tests passed in 43.57s 

4. Security Fix: Task Update Authorization
Before the fix
. Request: Patch /api/tasks/<task_UUID>
. User: dev@example.com(Viewer)
. Result: 200 ok
. Finding: The viewer could update a task

After the Fix
. Request: Patch /api/tasks/<task_UUID>
. User: dev@example.com(Viewer)
. Result: HTTP 403 Forbidden
. Response: "You do not have permission to update tasks"
. Outcome: Unauthorized task updates are rejected

Regression test
. Added a test verifying that viewers cannot update tasks.



D:\Project-test\q-taskboard>curl.exe -i -X POST "http://localhost:8000/api/projects/2ad5f652-9fe1-4768-bf06-3a87043bba98/export" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzk0NjU3ODg5LCJpYXQiOjE3OTIwNjU4ODksImp0aSI6IjcxODkzOGY3ODExMTQ4N2JiN2ZhNThhNzcxMWU1MWFhIiwidXNlcl9pZCI6ImUyNzc4NGY0LTUzOTYtNDQ0NS04YjZlLTVjMTExOWRiZWYyZiJ9.CMhrxGUwBW9-AhgiiVJIjRPvFfJvVFpnvSDZbF_oTzg"
HTTP/1.1 200 OK
Date: Thu, 15 Oct 2026 12:28:42 GMT
Server: WSGIServer/0.2 CPython/3.12.15
Content-Type: application/json
Vary: Accept, origin
Allow: POST, OPTIONS
Content-Length: 47

{"exported":1,"skipped":6,"failed_task_ids":[]}
D:\Project-test\q-taskboard>curl.exe -i -X POST "http://localhost:8000/api/projects/2ad5f652-9fe1-4768-bf06-3a87043bba98/export" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzk0NjU3ODg5LCJpYXQiOjE3OTIwNjU4ODksImp0aSI6IjcxODkzOGY3ODExMTQ4N2JiN2ZhNThhNzcxMWU1MWFhIiwidXNlcl9pZCI6ImUyNzc4NGY0LTUzOTYtNDQ0NS04YjZlLTVjMTExOWRiZWYyZiJ9.CMhrxGUwBW9-AhgiiVJIjRPvFfJvVFpnvSDZbF_oTzg"
HTTP/1.1 200 OK
Date: Thu, 15 Oct 2026 12:31:34 GMT
Server: WSGIServer/0.2 CPython/3.12.15
Content-Type: application/json
Vary: Accept, origin
Allow: POST, OPTIONS
Content-Length: 47

{"exported":0,"skipped":7,"failed_task_ids":[]}
