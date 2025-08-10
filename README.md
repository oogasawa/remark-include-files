
# remark-include-files


A Remark plugin for Docusaurus that conditionally includes the content of external files in your Markdown documents.

## Features

- Supports custom `%begin-include : "filename"` and `%end-include` markers in Markdown.
- Includes the content of the specified file if it exists; otherwise, the block is omitted from the output.
- Supports the syntax `!INCLUDE "filename", N` inside the include block to include only the first N lines of the file.
- Automatically renders the included content as a code block with appropriate language detection based on the file extension.


## Installation

This plugin is not published on npm. You can install it directly from GitHub in one of the following ways.

### 1. Install via npm from GitHub

```bash
npm install git+https://github.com/oogasawa/remark-include-files.git
```

### 2. Manual installation (recommended for local development)

Clone the repository into your Docusaurus project’s `plugins` directory:

```bash
cd your-docusaurus-project
mkdir -p plugins
cd plugins
git clone https://github.com/oogasawa/remark-include-files.git
```

This manual method allows you to edit and test the plugin locally without npm packaging.




## Usage

Add the plugin to your Docusaurus configuration in `docusaurus.config.js`:

```js
const remarkConditionalInclude = require('./plugins/remark-include-files');

module.exports = {
  presets: [
    [
      'classic',
      {
        docs: {
          remarkPlugins: [remarkConditionalInclude],
          // other options
        },
      },
    ],
  ],
};
```

## Syntax Example in Markdown

```md
%begin-include : "datafile.csv"

The contents of the datafile.csv are as follows.

!INCLUDE "datafile.csv", 5

%end-include
```

- If the specified `datafile.csv` exists, the plugin will include the first 5 lines of it as a code block.
- If the file does not exist, the entire block between `%begin-include` and `%end-include` will be omitted from the output.

## Notes

- File paths are resolved relative to the Markdown file location.
- The plugin currently supports only simple paragraph-based markers.
- The included file's language for syntax highlighting is inferred from its file extension.

## License

MIT License








