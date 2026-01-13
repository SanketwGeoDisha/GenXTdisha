// Babel plugin for adding metadata to React components
// This plugin can add source location information for visual editing features

/**
 * Babel plugin that adds metadata to JSX elements for visual editing
 * @returns {Object} - Babel plugin configuration
 */
function babelMetadataPlugin() {
  return {
    name: 'visual-edits-metadata',
    visitor: {
      // Add visitors here to transform JSX if needed
      // For now, this is a passthrough plugin
      JSXElement(path) {
        // Optional: Add data attributes with source location
        // This can be expanded to add __source props for visual editing
      },
    },
  };
}

module.exports = babelMetadataPlugin;
