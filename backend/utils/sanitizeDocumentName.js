const path = require('path');

const sanitizeDocumentName = (originalName) => {
  const base = path.basename(originalName || 'document');
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^a-zA-Z0-9._ -]/g, '_')
    .replace(/\.{2,}/g, '.')
    .trim()
    .slice(0, 255) || 'document';
  if (cleaned.split('.').length > 2) {
    throw new Error('Double extension filenames are not allowed');
  }
  return cleaned;
};

module.exports = { sanitizeDocumentName };
