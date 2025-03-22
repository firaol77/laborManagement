const fs = require('fs');
const path = require('path');

// Define the source directory and output file
const srcDir = path.join(__dirname, 'src'); // Corrected path
const outputFile = path.join(__dirname, 'combined_frontend.txt');

// Function to recursively read files
function readFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    console.log(`Reading directory: ${dir}`);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        console.log(`Entering subdirectory: ${filePath}`);
        readFiles(filePath, fileList); // Recurse into subdirectories
      } else if (file.endsWith('.js') || file.endsWith('.css')) {
        console.log(`Found file: ${filePath}`);
        fileList.push(filePath);
      }
    });
  } catch (err) {
    console.error(`Error reading directory: ${dir}`, err);
  }
  return fileList;
}

// Combine all files into a single file
try {
  const files = readFiles(srcDir);
  let combinedContent = '';
  files.forEach((file) => {
    combinedContent += `\n/* File: ${file} */\n`;
    combinedContent += fs.readFileSync(file, 'utf-8');
    combinedContent += '\n';
  });

  // Write the combined content to the output file
  fs.writeFileSync(outputFile, combinedContent);
  console.log(`Combined frontend code saved to ${outputFile}`);
} catch (err) {
  console.error('Error combining frontend code:', err);
}