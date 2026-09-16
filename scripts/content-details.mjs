import { parseFragment } from "parse5";

const WIDGET_NAME = "staffbase-custom-widget";
const TAXONOMY_ATTRIBUTE = "taxonomy-id";

/** Parse inert HTML; never execute scripts or load linked resources. */
function findWidget(html) {
  if (typeof html !== "string") throw new TypeError("Content must be an HTML string.");
  const widgets = [];
  const stack = [parseFragment(html)];
  while (stack.length) {
    const node = stack.pop();
    if (node.tagName === WIDGET_NAME) widgets.push(node);
    // Inert template contents and script text are not published widget instances.
    if (node.childNodes) stack.push(...node.childNodes);
  }
  if (widgets.length === 0) return null;
  if (widgets.length > 1) throw new Error("Multiple Content Details widgets found; keep one per language version.");
  return widgets[0];
}

export function extractTaxonomyId(html) {
  const widget = findWidget(html);
  if (!widget) return null;
  const value = widget.attrs.find(({ name }) => name === TAXONOMY_ATTRIBUTE)?.value;
  if (typeof value !== "string" || !value.trim() || [...value].length > 256) {
    throw new Error("Content Details widget has a missing or invalid taxonomy-id.");
  }
  return value;
}

/** Media assignments belong to this content item, not to the global file. */
export function extractMediaTaxonomies(html) {
  const widget = findWidget(html);
  const raw = widget?.attrs.find(({ name }) => name === "media-taxonomies")?.value;
  if (raw === undefined) return [];
  let entries;
  try { entries = JSON.parse(raw); }
  catch { throw new Error("Invalid media-taxonomies JSON."); }
  if (!Array.isArray(entries)) throw new Error("media-taxonomies must be an array.");
  const seen = new Set();
  return entries.map(entry => {
    if (!entry || typeof entry.mediaId !== "string" || !/^[^\s]+$/.test(entry.mediaId) || [...entry.mediaId].length > 256 ||
        typeof entry.taxonomyId !== "string" || !entry.taxonomyId.trim() || [...entry.taxonomyId].length > 256) {
      throw new Error("Each media entry needs a valid mediaId and taxonomyId.");
    }
    if (seen.has(entry.mediaId)) throw new Error(`Duplicate mediaId: ${entry.mediaId}. Keep one entry per photo/video.`);
    seen.add(entry.mediaId);
    return { mediaId: entry.mediaId, taxonomyId: entry.taxonomyId };
  });
}

/** Accept one News/Pages item with contents.<language>.content. */
export function extractContentDetails(item) {
  if (!item || typeof item !== "object" || !item.contents ||
      typeof item.contents !== "object" || Array.isArray(item.contents)) {
    throw new TypeError("Expected one Staffbase content item with a contents object.");
  }
  return Object.entries(item.contents).map(([language, translation]) => {
    if (!translation || typeof translation.content !== "string") {
      throw new TypeError(`Missing HTML content for language ${language}. Use the full content response.`);
    }
    try {
      return { language, taxonomyId: extractTaxonomyId(translation.content), mediaTaxonomies: extractMediaTaxonomies(translation.content) };
    } catch (error) {
      throw new Error(`${language}: ${error.message}`, { cause: error });
    }
  });
}
