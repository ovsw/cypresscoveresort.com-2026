// A published page never holds a block that draws nothing; see "A block
// never hides silently" in docs/agents/page-builder.md. Studio validation
// stops that in the editor, but content written through the API skips it.
// The Page Builder wraps each block in <div data-block-key="<_key>">, so
// a block that drew nothing leaves an empty wrapper, and a block with no
// renderer leaves no wrapper at all.

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} body The page's HTML.
 * @param {{ _key: string, _type: string }[]} blocks The page's `blocks`.
 * @returns {string[]} One line per block that drew nothing.
 */
export function findUnrenderedBlocks(body, blocks) {
  return blocks.flatMap(({ _key, _type }) => {
    const key = escapeRegExp(_key);
    const wrapper = new RegExp(`<div\\b[^>]*\\sdata-block-key="${key}"[^>]*>`);
    if (!wrapper.test(body)) {
      return [`${_type} (${_key}) has no renderer`];
    }
    // React may leave comment markers inside an otherwise empty wrapper. A
    // comment match must stop at its first "-->", or two markers around real
    // content would read as one long comment.
    const emptyWrapper = new RegExp(
      `<div\\b[^>]*\\sdata-block-key="${key}"[^>]*>(?:\\s|<!--(?:(?!-->)[\\s\\S])*-->)*</div>`,
    );
    return emptyWrapper.test(body) ? [`${_type} (${_key}) drew nothing`] : [];
  });
}
