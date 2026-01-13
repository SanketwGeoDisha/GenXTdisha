// Dev server setup for visual edits feature
// This module configures the webpack dev server for visual editing capabilities

/**
 * Setup function that configures the dev server for visual edits
 * @param {Object} devServerConfig - The webpack dev server configuration
 * @returns {Object} - Modified dev server configuration
 */
function setupDevServer(devServerConfig) {
  // Add any visual edits specific dev server configuration here
  // For now, return the config unchanged as a passthrough
  
  return {
    ...devServerConfig,
    // Add visual edits specific headers if needed
    headers: {
      ...devServerConfig.headers,
      'X-Visual-Edits': 'enabled',
    },
  };
}

module.exports = setupDevServer;
