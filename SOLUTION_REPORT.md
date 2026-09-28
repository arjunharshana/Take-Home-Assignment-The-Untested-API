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
