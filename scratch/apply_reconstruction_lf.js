const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\scratch';
const files = fs.readdirSync(scratchDir).filter(f => f.startsWith('extracted_replace_') && f.endsWith('.json'));

const edits = [];
for (const file of files) {
  const filePath = path.join(scratchDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const match = file.match(/extracted_replace_(\d+)_(.+)\.json/);
    const step = parseInt(match[1]);
    const targetFile = (data.TargetFile || data.AbsolutePath || '').replace(/"/g, '');
    edits.push({
      step,
      file,
      targetFile,
      instruction: data.Instruction || '',
      description: data.Description || '',
      targetContent: data.TargetContent,
      replacementContent: data.ReplacementContent,
      chunks: data.ReplacementChunks || null
    });
  } catch (e) {
    console.error("Error parsing", file, e);
  }
}

// Sort by step number
edits.sort((a, b) => a.step - b.step);

console.log(`Found ${edits.length} edits to apply.`);

// Helper to normalize newlines to LF
function normalize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\r\n/g, '\n');
}

for (const edit of edits) {
  if (!edit.targetFile) {
    console.log(`[Step ${edit.step}] Skipping: No target file specified in ${edit.file}`);
    continue;
  }
  
  if (!fs.existsSync(edit.targetFile)) {
    console.log(`[Step ${edit.step}] Warning: Target file does not exist: ${edit.targetFile}`);
    continue;
  }

  let content = normalize(fs.readFileSync(edit.targetFile, 'utf8'));
  console.log(`[Step ${edit.step}] Applying to ${path.basename(edit.targetFile)}: "${edit.instruction || edit.description}"`);

  if (edit.chunks) {
    // This is a multi_replace_file_content
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < edit.chunks.length; i++) {
      const chunk = edit.chunks[i];
      let target = chunk.TargetContent;
      let replacement = chunk.ReplacementContent;
      
      // Clean quotes if double-serialized
      if (typeof target === 'string' && target.startsWith('"') && target.endsWith('"')) {
        try { target = JSON.parse(target); } catch (e) {}
      }
      if (typeof replacement === 'string' && replacement.startsWith('"') && replacement.endsWith('"')) {
        try { replacement = JSON.parse(replacement); } catch (e) {}
      }

      target = normalize(target);
      replacement = normalize(replacement);

      if (content.includes(target)) {
        content = content.replace(target, replacement);
        successCount++;
      } else {
        console.log(`  [Chunk ${i}] FAIL: TargetContent not found!`);
        failCount++;
      }
    }
    fs.writeFileSync(edit.targetFile, content, 'utf8');
    console.log(`  Result: ${successCount} succeeded, ${failCount} failed.`);
  } else {
    // This is a replace_file_content
    let target = edit.targetContent;
    let replacement = edit.replacementContent;
    
    // Clean quotes if double-serialized
    if (typeof target === 'string' && target.startsWith('"') && target.endsWith('"')) {
      try { target = JSON.parse(target); } catch (e) {}
    }
    if (typeof replacement === 'string' && replacement.startsWith('"') && replacement.endsWith('"')) {
      try { replacement = JSON.parse(replacement); } catch (e) {}
    }

    target = normalize(target);
    replacement = normalize(replacement);

    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(edit.targetFile, content, 'utf8');
      console.log(`  Result: SUCCESS`);
    } else {
      console.log(`  Result: FAIL: TargetContent not found!`);
    }
  }
}
console.log("Reconstruction application completed.");
