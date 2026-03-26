// scripts/auditMarkdown.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
function getAllMdFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMdFiles(filePath));
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  });
  return results;
}

function hasReference(mdFile) {
  const fileName = path.basename(mdFile);
  try {
    const grepResult = execSync(`grep -R "${fileName}" ${projectRoot} --exclude-dir=node_modules --exclude='*.lock'`, { stdio: 'pipe' }).toString();
    return grepResult.trim().length > 0;
  } catch (e) {
    // grep returns non-zero exit code when no matches
    return false;
  }
}

function main() {
  const mdFiles = getAllMdFiles(projectRoot);
  const unused = [];
  mdFiles.forEach(file => {
    if (!hasReference(file)) {
      unused.push(file);
    }
  });
  if (unused.length === 0) {
    console.log('No unused markdown files found.');
  } else {
    console.log('Unused markdown files:');
    unused.forEach(f => console.log(f));
  }
}

main();
