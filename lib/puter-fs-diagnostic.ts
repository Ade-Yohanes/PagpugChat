/**
 * Puter.js File System API Testing Utilities
 * Use this in browser console to test API functionality
 */

/**
 * Initialize and test Puter connection
 */
export async function testPuterConnection() {
  console.log('=== Testing Puter Connection ===');
  
  if (typeof window === 'undefined') {
    console.error('Not in browser environment');
    return false;
  }

  if (!window.puter) {
    console.error('Puter not available on window object');
    return false;
  }

  console.log('✓ Puter object found:', window.puter);
  console.log('✓ Puter.fs available:', !!window.puter.fs);
  
  return true;
}

/**
 * Test listDirectory function
 */
export async function testListDirectory(path: string = './') {
  console.log(`\n=== Testing listDirectory("${path}") ===`);
  
  try {
    if (!window.puter?.fs) {
      throw new Error('Puter.fs not available');
    }

    console.log('Calling puter.fs.readdir...');
    const items = await window.puter.fs.readdir(path);
    
    console.log('✓ Success! Items found:', items?.length || 0);
    console.log('Items:', items);
    
    return items;
  } catch (error) {
    console.error('✗ Error:', error);
    return null;
  }
}

/**
 * Test createFolder function
 */
export async function testCreateFolder(folderName: string = 'test-folder-' + Date.now()) {
  console.log(`\n=== Testing createFolder("${folderName}") ===`);
  
  try {
    if (!window.puter?.fs) {
      throw new Error('Puter.fs not available');
    }

    console.log('Calling puter.fs.mkdir...');
    const result = await window.puter.fs.mkdir(folderName);
    
    console.log('✓ Success! Created folder:', result);
    console.log('Result properties:', {
      name: result?.name,
      path: result?.path,
      is_dir: (result as any)?.is_dir,
      uid: result?.uid,
    });
    
    return result;
  } catch (error) {
    console.error('✗ Error:', error);
    return null;
  }
}

/**
 * Test deleteFolder function
 */
export async function testDeleteFolder(folderPath: string) {
  console.log(`\n=== Testing deleteFolder("${folderPath}") ===`);
  
  try {
    if (!window.puter?.fs) {
      throw new Error('Puter.fs not available');
    }

    console.log('Calling puter.fs.delete...');
    const result = await window.puter.fs.delete(folderPath, { recursive: true });
    
    console.log('✓ Success! Folder deleted, result:', result);
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

/**
 * Test writeFile function
 */
export async function testWriteFile(
  fileName: string = 'test-file-' + Date.now() + '.txt',
  content: string = 'Hello, Puter!'
) {
  console.log(`\n=== Testing writeFile("${fileName}") ===`);
  
  try {
    if (!window.puter?.fs) {
      throw new Error('Puter.fs not available');
    }

    console.log('Calling puter.fs.write...');
    const result = await window.puter.fs.write(fileName, content);
    
    console.log('✓ Success! File written:', result);
    console.log('Result properties:', {
      name: result?.name,
      path: result?.path,
      size: result?.size,
      uid: result?.uid,
    });
    
    return result;
  } catch (error) {
    console.error('✗ Error:', error);
    return null;
  }
}

/**
 * Test readFile function
 */
export async function testReadFile(filePath: string) {
  console.log(`\n=== Testing readFile("${filePath}") ===`);
  
  try {
    if (!window.puter?.fs) {
      throw new Error('Puter.fs not available');
    }

    console.log('Calling puter.fs.read...');
    const blob = await window.puter.fs.read(filePath);
    const text = await blob.text();
    
    console.log('✓ Success! File read:');
    console.log('Content:', text);
    
    return text;
  } catch (error) {
    console.error('✗ Error:', error);
    return null;
  }
}

/**
 * Run all tests in sequence
 */
export async function runAllTests() {
  console.clear();
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Puter.js File System API Test Suite  ║');
  console.log('╚════════════════════════════════════════╝');

  // Test 1: Connection
  const hasConnection = await testPuterConnection();
  if (!hasConnection) {
    console.error('\n✗ Puter not available. Aborting tests.');
    return;
  }

  // Test 2: List Directory (root)
  await testListDirectory('./');

  // Test 3: Create Folder
  const folderName = 'test-folder-' + Date.now();
  const createdFolder = await testCreateFolder(folderName);

  // Test 4: Write File
  const fileName = 'test-file-' + Date.now() + '.txt';
  const createdFile = await testWriteFile(fileName, 'Test content from diagnostic');

  // Test 5: Read File
  if (createdFile?.path) {
    await testReadFile(createdFile.path);
  }

  // Test 6: List Directory again
  await testListDirectory('./');

  // Test 7: Cleanup - Delete File (WITH PATH NORMALIZATION)
  console.log('\n=== Cleanup Phase ===');
  if (createdFile?.path) {
    console.log('Deleting file...');
    // Normalize path - remove leading slashes
    let filePath = createdFile.path;
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    await testDeleteFolder(filePath);
  }

  // Test 8: Cleanup - Delete Folder (WITH PATH NORMALIZATION)
  if (createdFolder?.path) {
    console.log('Deleting folder...');
    // Normalize path - remove leading slashes
    let folderPath = createdFolder.path;
    if (folderPath.startsWith('/')) {
      folderPath = folderPath.substring(1);
    }
    await testDeleteFolder(folderPath);
  }

  // Test 9: Verify deletion
  console.log('\n=== Verification ===');
  await testListDirectory('./');

  console.log('\n✓ All tests completed!');
}

/**
 * Export all functions to window for console access
 */
export function exposeTestingTools() {
  if (typeof window !== 'undefined') {
    (window as any).PuterTestTools = {
      testPuterConnection,
      testListDirectory,
      testCreateFolder,
      testDeleteFolder,
      testWriteFile,
      testReadFile,
      runAllTests,
    };
    
    console.log(
      '%cPuter Testing Tools Ready! 🚀',
      'color: #00ff00; font-weight: bold; font-size: 14px'
    );
    console.log(
      '%cUse: PuterTestTools.runAllTests() to run all tests',
      'color: #00ffff'
    );
  }
}

// Auto-expose on import
if (typeof window !== 'undefined') {
  exposeTestingTools();
}
