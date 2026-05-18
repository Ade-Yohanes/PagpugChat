# File System Feature - Debugging & Testing Guide

## What Was Fixed

### 1. **Path Handling Issues** (lib/puter-fs.ts)
- **Problem**: Paths were using absolute format (`/folder`) but Puter.js API prefers relative paths
- **Fix**: Removed leading slashes from paths before sending to Puter API
- **Changes**:
  - `createFolder`: Now properly strips leading slashes
  - `listDirectory`: Uses `./` for root directory instead of `/`
  - `deleteItem`: Normalizes paths before deletion
  - `uploadFileToPath`: Removes leading slashes for file upload

### 2. **Added Console Logging** (lib/puter-fs.ts)
- All functions now log operations to browser console
- Logs show: function name, input path, result/error
- Format: `[functionName] message`
- Helps diagnose where operations fail

### 3. **Created Diagnostic Tools** (lib/puter-fs-diagnostic.ts)
- Testing utilities to validate Puter.js connection
- Functions to test each API operation independently
- `PuterTestTools.runAllTests()` - automated test suite
- Available in browser console after component loads

### 4. **Improved Error Handling** (FileSystemBrowser.tsx)
- Component now logs all errors with full details
- Errors include stack traces and message details
- Development info panel shows current path and item count
- Better error messages passed to UI

---

## How to Debug Create Folder Issue

### Step 1: Open Browser Console
1. While app is running, press **F12** (or right-click → Inspect)
2. Go to **Console** tab
3. Look for message: `✓ Diagnostic tools loaded. Open browser console for PuterTestTools`

### Step 2: Test Puter Connection
```javascript
PuterTestTools.testPuterConnection()
```
**Expected Output:**
```
=== Testing Puter Connection ===
✓ Puter object found: {...}
✓ Puter.fs available: true
```

### Step 3: Test List Directory
```javascript
PuterTestTools.testListDirectory('./')
```
**Expected Output:**
```
✓ Success! Items found: N
Items: [...]
```

### Step 4: Test Create Folder
```javascript
PuterTestTools.testCreateFolder('my-test-folder')
```
**Expected Output:**
```
✓ Success! Created folder: {...}
Result properties: {
  name: "my-test-folder"
  path: "my-test-folder"
  is_dir: true
  uid: "..."
}
```

### Step 5: Run Full Test Suite
```javascript
PuterTestTools.runAllTests()
```
This will:
1. Test Puter connection ✓
2. List root directory ✓
3. Create test folder ✓
4. Write test file ✓
5. Read test file ✓
6. List directory again ✓
7. Clean up test files ✓

---

## What to Look For in Console

### ✅ Successful Create Folder
```
[FileSystemBrowser] Creating folder: test-folder in path: /
[puter-fs.ts] Creating folder at path: test-folder
[puter-fs.ts] Success: {name: "test-folder", path: "test-folder", ...}
```

### ❌ Failed Create Folder
```
[FileSystemBrowser] Creating folder: test-folder in path: /
[puter-fs.ts] Creating folder at path: test-folder
[puter-fs.ts] Error: [Error message from Puter API]
[FileSystemBrowser] Create folder error: [Error message]
```

---

## Common Issues & Solutions

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| "Puter not initialized" | Puter.js not loaded | Check if Puter SDK is included in HTML |
| "mkdir failed" | Wrong path format | Ensure path has no leading slashes |
| "Permission denied" | User not authenticated | Check Puter authentication |
| "Path already exists" | Duplicate folder name | Use different folder name |
| "Cannot read property 'fs' of undefined" | Puter not on window | Check Puter initialization timing |

---

## File Structure

```
lib/
  ├── puter-fs-types.ts          # Type definitions
  ├── puter-fs.ts                 # Core functions (FIXED)
  └── puter-fs-diagnostic.ts      # Testing tools (NEW)

components/
  └── FileSystemBrowser.tsx       # Main component (IMPROVED)
```

---

## Testing Workflow

### For UI Testing:
1. Click "Files" menu in sidebar
2. Try operations: Create, Upload, Delete
3. Check browser console for logs
4. Check UI for success/error messages

### For API Testing:
1. Open console (F12)
2. Run `PuterTestTools.testCreateFolder('test-folder')`
3. Verify folder appears in file list
4. Check console output for any errors

### For Full Validation:
1. In console, run: `PuterTestTools.runAllTests()`
2. Wait for all tests to complete
3. Check console for ✓ or ✗ marks

---

## Next Steps if Still Failing

1. **Capture full console output** - Screenshot entire console log
2. **Check Puter documentation** - Verify API version matches
3. **Check network tab** - Verify API requests are being sent
4. **Check authentication** - Ensure user is logged in to Puter

---

## Related Files Modified

- [lib/puter-fs.ts](../lib/puter-fs.ts) - Path handling fixes + logging
- [components/FileSystemBrowser.tsx](../components/FileSystemBrowser.tsx) - Error handling improvements
- [lib/puter-fs-diagnostic.ts](../lib/puter-fs-diagnostic.ts) - NEW testing utilities

---

## Usage Example in Code

```typescript
// Using the createFolder function
try {
  await createFolder('/', 'my-new-folder');
  // Success - folder created
} catch (error) {
  // Error - check console for details
  console.error('Failed:', error.message);
}
```

---

**Last Updated**: April 11, 2026
