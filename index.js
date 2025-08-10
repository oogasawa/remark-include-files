const fs = require('fs');
const path = require('path');

module.exports = function remarkConditionalInclude() {
  return async function transformer(tree, file) {
    const toRemoveIndexes = [];

    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      if (node.type === 'paragraph' && node.children.length === 1 && node.children[0].type === 'text') {
        const text = node.children[0].value.trim();

        if (text.startsWith('%begin-include')) {
          // %begin-include : "Makefile"
          const beginLineIndex = i;
          // Extract filename
          const fileMatch = text.match(/%begin-include\s*:\s*"(.+?)"/);
          if (!fileMatch) continue;

          const includeFileName = fileMatch[1];
          // Search for closing line %end-include
          let endLineIndex = -1;
          for (let j = i + 1; j < tree.children.length; j++) {
            const nextNode = tree.children[j];
            if (
              nextNode.type === 'paragraph' &&
              nextNode.children.length === 1 &&
              nextNode.children[0].type === 'text' &&
              nextNode.children[0].value.trim() === '%end-include'
            ) {
              endLineIndex = j;
              break;
            }
          }
          if (endLineIndex === -1) {
            // Skip if no closing end found
            continue;
          }

          // Concatenate contents between begin and end into a single text
          const innerNodes = tree.children.slice(i + 1, endLineIndex);
          const innerText = innerNodes
            .map((n) =>
              n.type === 'paragraph'
                ? n.children.map((c) => c.value).join('')
                : n.value || ''
            )
            .join('\n');

          // Check if file exists
          const baseDir = path.dirname(file.path || '.');
          const includeFilePath = path.resolve(baseDir, includeFileName);
          if (!fs.existsSync(includeFilePath)) {
            // If file does not exist, remove this entire block
            tree.children.splice(beginLineIndex, endLineIndex - beginLineIndex + 1);
            i = beginLineIndex - 1;
            continue;
          }

          // Detect !INCLUDE "filename", number pattern in innerText and read only specified number of lines
          const includeLineMatch = innerText.match(/!INCLUDE\s*"(.+?)"(?:\s*,\s*(\d+))?/);
          let contentToInsert = '';
          if (includeLineMatch) {
            const incFile = includeLineMatch[1];
            const lineCount = includeLineMatch[2] ? parseInt(includeLineMatch[2], 10) : null;
            const incFilePath = path.resolve(baseDir, incFile);
            if (fs.existsSync(incFilePath)) {
              const allLines = fs.readFileSync(incFilePath, 'utf-8').split(/\r?\n/);
              if (lineCount) {
                contentToInsert = allLines.slice(0, lineCount).join('\n');
              } else {
                contentToInsert = allLines.join('\n');
              }
            }
          } else {
            // If no !INCLUDE found, insert empty or original text (here, empty)
            contentToInsert = '';
          }

          // Create new nodes for insertion (code block)
          const newNodes = [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: innerText.replace(/!INCLUDE\s*".+?"(?:\s*,\s*\d+)?/, '') }],
            },
            {
              type: 'code',
              lang: path.extname(includeFileName).substring(1) || 'text',
              value: contentToInsert,
            },
          ];

          // Replace the original nodes with new nodes
          tree.children.splice(beginLineIndex, endLineIndex - beginLineIndex + 1, ...newNodes);
          i = beginLineIndex + newNodes.length - 1;
        }
      }
    }
  };
};
