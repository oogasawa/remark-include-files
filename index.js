const fs = require('fs');
const path = require('path');
const { visit } = require('unist-util-visit');

function parseAttributes(tag) {
  const attrs = {};
  const attrPattern = /(\w+)\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = attrPattern.exec(tag)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

function ensureCodeBlockImport(tree) {
  // Insert `import CodeBlock from '@theme/CodeBlock'` at top if not present.
  let hasImport = false;
  for (const node of tree.children || []) {
    if (node.type === 'mdxjsEsm' && typeof node.value === 'string') {
      if (node.value.includes(`from '@theme/CodeBlock'`) || node.value.includes('from "@theme/CodeBlock"')) {
        hasImport = true;
        break;
      }
    }
  }
  if (!hasImport) {
    tree.children.unshift({
      type: 'mdxjsEsm',
      value: `import CodeBlock from '@theme/CodeBlock';`,
    });
  }
}

function escapeForJSXText(s) {
  // Minimal escaping for embedding as JSX text child.
  // Avoid accidentally closing the component.
  return s.replace(/<\/CodeBlock>/g, '</Co­deBlock>');
}

function remarkIncludeFiles() {
  return function transformer(tree, file) {
    ensureCodeBlockImport(tree);

    visit(tree, 'jsx', (node, index, parent) => {
      const m = node.value && node.value.match(/^<include\s+([^>]+)\s*\/>$/);
      if (!m) return;

      const attrs = parseAttributes(m[1] || '');
      const src = attrs.src;
      if (!src) {
        // No src attribute; drop the node quietly.
        parent.children.splice(index, 1);
        return;
      }

      const head = attrs.head ? parseInt(attrs.head, 10) : null;
      const lang = attrs.lang || '';              // e.g., "bash", "text"
      const title = attrs.title || '';            // file title shown in CodeBlock

      const absolutePath = path.resolve(path.dirname(file.path), src);
      if (!fs.existsSync(absolutePath)) {
        // File missing: remove the include silently.
        parent.children.splice(index, 1);
        return;
      }

      const raw = fs.readFileSync(absolutePath, 'utf8');
      const lines = raw.split('\n');
      const displayed = head ? lines.slice(0, head).join('\n') : raw;

      // Prefer absolute URL if author uses /... pointing to static/.
      const downloadUrl = encodeURI(src.startsWith('/') ? src : `./${src}`);

      // Build JSX for <CodeBlock>…</CodeBlock>
      const codeProps = [];
      if (lang) codeProps.push(`language="${lang}"`);
      if (title) codeProps.push(`title="${title}"`);
      const propStr = codeProps.length ? ' ' + codeProps.join(' ') : '';

      const codeJsx = `<CodeBlock${propStr}>
${escapeForJSXText(displayed)}
</CodeBlock>`;

      // Replace the single <include/> with: JSX CodeBlock node + a paragraph link node.
      parent.children.splice(
        index,
        1,
        { type: 'jsx', value: codeJsx },
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: downloadUrl,
              children: [{ type: 'text', value: 'Download full file' }],
            },
          ],
        }
      );
    });
  };
}

module.exports = remarkIncludeFiles;
