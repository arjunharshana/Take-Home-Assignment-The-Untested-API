# Day 1: Test Results & Coverage Summary

## Coverage Output

```text
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------|---------|----------|---------|---------|-------------------
All files        |   88.05 |    77.33 |    92.3 |   86.88 |                   
 src             |   69.23 |       75 |       0 |   69.23 |                   
  app.js         |   69.23 |       75 |       0 |   69.23 | 10-11,17-18       
 src/routes      |   86.36 |       70 |     100 |   86.36 |                   
  tasks.js       |   86.36 |       70 |     100 |   86.36 | 15-16,20-23       
 src/services    |   98.14 |    82.35 |     100 |   97.61 |                   
  taskService.js |   98.14 |    82.35 |     100 |   97.61 | 24                
 src/utils       |   78.26 |    79.41 |     100 |   78.26 |                   
  validators.js  |   78.26 |    79.41 |     100 |   78.26 | 9,12,22,25,31     
-----------------|---------|----------|---------|---------|-------------------

Test Suites: 1 failed, 1 passed, 2 total
Tests:       3 failed, 19 passed, 22 total
Snapshots:   0 total
Time:        2.677 s
```

## Notes
- **Overall Line Coverage:** 86.88%.
- **Failing Tests:** 3 unit tests intentionally failed because they successfully caught existing bugs in the `taskService.js` logic (`getByStatus`, `getPaginated`, and `completeTask`).


# Day 2: Bug Report

This report outlines the three issues identified during the Day 1 test suite run.

---

### Bug 1: `completeTask` Overwrites Existing Priority

* **Location:** `src/services/taskService.js` (lines 81–93)
* **How Discovered:** Unit test `Task Service Unit Tests › completeTask() › marks a task as done without altering other fields` failed.
* **Expected Behavior:** Completing a task should only update its `status` to `'done'` and set `completedAt` to an ISO timestamp, leaving the existing `priority` unchanged.
* **Actual Behavior:** The `completeTask` function hardcodes `priority: 'medium'` during the object update, overriding any previously assigned priority (`'high'` or `'low'`).
* **Fix:** Remove `priority: 'medium'` from the updated object payload in `completeTask`:
  ```javascript
  const updated = {
    ...task,
    status: 'done',
    completedAt: new Date().toISOString(),
  };
  ```

---

### Bug 2: Pagination Skips First Page (Off-by-One Calculation)

* **Location:** `src/services/taskService.js` (lines 14–17)
* **How Discovered:** Unit test `Task Service Unit Tests › getPaginated() › returns the first page correctly` failed when requesting page `1` and receiving items starting at index `2`.
* **Expected Behavior:** Requesting page `1` with limit `10` should return items from index `0` to `9` (offset `0`).
* **Actual Behavior:** The service calculates the offset as `const offset = page * limit;`. When `page = 1` and `limit = 10`, `offset` evaluates to `10`, skipping the first 10 tasks entirely.
* **Fix:** Adjust the offset calculation to account for 1-based page indices:
```javascript
const getPaginated = (page, limit) => {
  const pageNum = Math.max(1, page);
  const offset = (pageNum - 1) * limit;
  return tasks.slice(offset, offset + limit);
};
```

---

### Bug 3: Substring Matching in Status Filter

* **Location:** `src/services/taskService.js` (line 12)
* **How Discovered:** Unit test `Task Service Unit Tests › getByStatus() › returns exact matches for status` failed when querying `'do'` and receiving both `'todo'` and `'done'`.
* **Expected Behavior:** Filtering by a status should return strictly identical matches (`task.status === status`).
* **Actual Behavior:** The filter uses `t.status.includes(status)`. A query parameter like `?status=do` or `?status=o` inadvertently matches both `'todo'` and `'done'`.
* **Fix:** Use strict equality matching:
```javascript
const getByStatus = (status) => tasks.filter((t) => t.status === status);
```

---

# Part B: Fix Bug

### Fix Bug 1

* In `src/services/taskService.js`.


Update the `completeTask` method to remove the hardcoded `priority` override:

```javascript
const completeTask = (id) => {
  const task = findById(id);
  if (!task) return null;

  const updated = {
    ...task,
    status: 'done',
    completedAt: new Date().toISOString(),
  };

  const index = tasks.findIndex((t) => t.id === id);
  tasks[index] = updated;
  return updated;
};
```

### Fix Bug 2:

To get all Day 1 unit tests green:

* In `src/services/taskService.js`, change line 12 to:
  ```javascript
  const getByStatus = (status) => tasks.filter((t) => t.status === status);
  ```
### Fix Bug 3:

* In `src/services/taskService.js`, change line 14 to:
  ```javascript
  const offset = (page - 1) * limit;
  ```

---

# Part C: New Feature (`PATCH /tasks/:id/assign`)

## Design Decisions

* **Validation:** The request payload must include a non-empty `assignee` string. Supplying a non-string or whitespace-only string returns `400 Bad Request`.

* **Reassignment Policy:** If a task already has an assignee, incoming requests overwrite the existing assignee. Reassigning tasks between team members is expected behavior in task trackers.

* **Return Shape:** Returns the updated task object with HTTP `200 OK` on success, or HTTP `404 Not Found` if the task does not exist.

---


# Final Notes

## What I'd Test Next If I Had More Time

- **Concurrency:** How the in-memory array handles rapid, simultaneous write/update requests to the same task ID.
- **Data limits:** Testing pagination and memory constraints with a massive dataset.

## Anything That Surprised Me in the Codebase

- Storing `createdAt` and `dueDate` as ISO strings rather than native Date objects or Unix timestamps.

## Questions I'd Ask Before Shipping This to Production

- Are we planning to implement a JWT-based authentication microservice to verify users before allowing them to trigger the `/assign` or `/complete` routes?