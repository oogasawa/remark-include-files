
# remark-include-files

A Remark plugin for Docusaurus that lets you include external text files in MDX using a simple custom tag. It renders the included content with the Docusaurus `<CodeBlock>` component and appends a "Download full file" link.

## Usage

```mdx
<include src="./result.txt" head="10" lang="bash" title="result.txt" />
````

The example above renders the first 10 lines of `result.txt` in a themed `<CodeBlock>` and adds a link to download the entire file.

- `src` (required): Relative path from the MDX file to the target file. Files under `static/` can be referenced with an absolute path (e.g., `/result.txt`) so the download link works at runtime.
- `head` (optional): Number of head lines to include. If omitted, the whole file is rendered.
- `lang` (optional): Syntax highlighting language passed to `<CodeBlock language="...">`.
- `title` (optional): A title shown by `<CodeBlock>`.

If the file does not exist, the tag is ignored without throwing an error.

## Installation

```bash
npm install @yourname/remark-include-files
```

## Docusaurus config

Add the following line at the beginning of `docusaurus.config.js`:

```js
import {themes as prismThemes} from 'prism-react-renderer';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkIncludeFiles from 'remark-include-files'; // Added
```

Also, in the `remarkPlugins` section, add it like this:

```js
module.exports = {
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          showLastUpdateTime: true,
          remarkPlugins: [
            remarkMath,
            remarkIncludeFiles // Added here
          ],
          rehypePlugins: [rehypeKatex],
          // editUrl: 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
      }),
    ],
  ],
};
```


## Notes

- The plugin auto-injects `import CodeBlock from '@theme/CodeBlock'` into the MDX if it is not already present.
- For reliable downloads, place large or runtime-served files under `static/` and reference them with absolute paths, e.g. `src="/artifacts/result.txt"`.

