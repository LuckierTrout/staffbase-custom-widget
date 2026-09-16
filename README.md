# Chevron Content Details

A Staffbase custom widget for **news stories and pages**. Editors enter a Taxonomy ID in widget settings; readers see no widget content. The value is stored as the widget's `taxonomy-id` HTML attribute for extraction from a content API response.

**Status:** implemented and verified locally. Hosting, Staffbase installation, and live News/Pages API persistence have not been verified. Email is outside this version's scope.

## Local preview

```sh
npm ci
npm start
```

Open http://localhost:9000. Enter a Taxonomy ID and select **Apply to preview**. The editor preview displays the ID; the reader preview has no widget or gap. The HTML panel illustrates the expected attribute contract; it is not a live API response. Local preview changes reset on reload.

## Editor workflow in Staffbase

1. Insert **Chevron Content Details** into a news article or page.
2. Open widget settings and enter **Taxonomy ID** (required; 1–256 characters, not whitespace-only).
3. Save the widget and the article/page.
4. Use one instance per language version. If several translations represent the same content, enter the same taxonomy ID in each translation.

Values remain strings: `000123` stays `000123`. The field accepts punctuation and Unicode. The editor can reopen and update it. Removing the widget removes the taxonomy ID; duplication or translation may copy the value, so review it when reusing content. The widget validates its own settings; it cannot require every story/page to contain a widget or enforce global uniqueness.

In the published view, the widget hides its host and clears its rendering container. In the editor, Staffbase's `renderBlockInEditor` hook restores a selectable preview. No global CSS or network requests are added. The local host simulation does not prove every Staffbase theme, surrounding wrapper, or mobile editor behavior.

This is visually hidden metadata, not confidential storage. Readers with access to the content may inspect its underlying HTML. Do not enter secrets.

## Tag individual photos/videos within a story

The same widget now includes an optional **Photos and videos in this story** list. The existing required **Taxonomy ID** still tags the story/page. For each media entry:

1. Add the photo/video to the story using Staffbase's normal media tools.
2. Obtain that uploaded file's actual Media ID from an authorized Media API response. A filename, CDN URL, or external video URL is not a Media ID.
3. Open **Chevron Content Details**, add an entry, and enter **Staffbase Media ID** and **Media Taxonomy ID**.
4. Add more entries for other assets, then save. Remove an entry if you remove that media from the story.

Use one entry per Media ID in each language version. Exact duplicate rows are rejected by the form. If the same Media ID is entered with different taxonomy values, the editor preview warns and the extraction helper rejects the ambiguous mapping.

These associations belong to the current story/page only. They do not change the file's global metadata or automatically follow it elsewhere. Both IDs are entered manually; this version has no media picker and does not verify that the asset exists or is used in the story. Two occurrences of the same file in one story share one mapping. Externally embedded media without a Staffbase Media ID needs a separate identifier approach.

Media entries are saved as JSON in the `media-taxonomies` attribute. The widget's explicit serialization preserves strings and escapes quotes through normal HTML attribute serialization. The extraction output now includes `mediaTaxonomies`, including an empty array for older widgets without media entries:

```json
[
  {
    "language": "en_US",
    "taxonomyId": "CVX-2026-001",
    "mediaTaxonomies": [
      { "mediaId": "example-photo-id", "taxonomyId": "CVX-PHOTO-001" },
      { "mediaId": "example-video-id", "taxonomyId": "CVX-VIDEO-001" }
    ]
  }
]
```

Try the explicitly synthetic example:

```sh
npm run extract:metadata -- examples/media-content-response.json
```

For live acceptance, add a real photo and video, enter their IDs and distinct taxonomy values, save/reopen, and confirm both pairs survive in the story/page API response. Change one pair and remove the other; confirm the next API response and helper output reflect both edits. Verify the reader view stays empty. This API persistence remains unverified until tested in Staffbase.

## Build and install

```sh
npm run build
```

Output: `dist/chevron.staffbase-custom-widget.js`.

Host the generated bundle at an HTTPS URL reachable by Staffbase readers, and install that URL under custom widgets in Staffbase Studio. Custom widgets must be enabled for your organization. For development, Staffbase documents using `http://localhost:9000/chevron.staffbase-custom-widget.js` while the local server runs; that URL only works on the developer's computer and depends on browser/network policy.

The registered element name remains `staffbase-custom-widget`; the editor label is **Chevron Content Details**. Do not change the element name or `taxonomy-id` attribute after rollout without a content migration.

[Staffbase development and installation guide](https://developers.staffbase.com/frameworks/customwidget-development/)

## Extract the value from API content

The intended contract is HTML like this inside `contents.<language>.content`:

```html
<staffbase-custom-widget taxonomy-id="CVX-2026-001"></staffbase-custom-widget>
```

Retrieve a full item using the [News API](https://developers.staffbase.com/api/api-news/) (`GET /api/posts/{postID}`) or [Pages API](https://developers.staffbase.com/api/api-pages/) (`GET /api/pages/{pageId}`). Use an authorized API client and save the JSON response to a local file. Do not commit API tokens or actual content responses to this repository.

Then run:

```sh
node scripts/extract-metadata.mjs /path/to/response.json
```

Or pipe one JSON item into `node scripts/extract-metadata.mjs`. The helper reads local input only; it does not make API calls or require credentials. It outputs one record per language:

```json
[
  { "language": "en_US", "taxonomyId": "CVX-2026-001", "mediaTaxonomies": [] }
]
```

- No widget: `taxonomyId: null`.
- Duplicate widgets, an invalid/missing attribute, or missing HTML: a descriptive error and nonzero CLI exit code.
- HTML entities are decoded using a real HTML parser. Scripts and resource URLs are never executed or loaded.
- The story taxonomy is a plain string and media entries are a JSON string, matching this widget's explicit `parseConfig`/`parseAttributes` implementation. They are not Base64-encoded.
- List envelopes are not accepted: pass each full content item separately. Retain the source item's ID when joining the extracted values to analytics or other data.

You can also import the helper from another Node.js integration (with `parse5` installed):

```js
import { extractContentDetails } from './scripts/content-details.mjs';
const details = extractContentDetails(item);
const rows = details.map(detail => ({ contentId: item.id, ...detail }));
```

The synthetic fixture is explicitly not a captured Staffbase response:

```sh
npm run extract:metadata -- examples/content-response.json
```

This approach extracts data from the HTML field. It does not add a top-level custom field to Staffbase's API, native filters, or analytics responses.

## Required live acceptance check

After hosting and installation:

1. Add the widget to one test news article and one test page with Taxonomy ID `000123`.
2. Save, close, reopen settings, and confirm the ID remains `000123`.
3. Publish to a test audience. Confirm the widget has no visible content, card, title, or unwanted spacing in desktop and mobile reader views.
4. Retrieve each full item through its content API and run the extraction helper. Confirm `taxonomyId` is `000123`.
5. Change the ID to `CVX-002`, save, and retrieve again. Confirm the new value replaces the old one.
6. Remove the widget, save, and verify the extractor returns `null`. Check translations and duplicate-content workflows you use.

If Staffbase omits the custom element/attribute from these API responses, the HTML-based integration is not proven and needs a different storage approach. Local tests cannot establish this server behavior.

## Validation

```sh
npm run type-check
npm run lint
npm test
npm run build
```

Tests cover editor/reader rendering, literal string round trips, form validation and updates, HTML escaping, translation handling, missing/duplicate metadata, and CLI file/stdin input. A local browser check also verifies a zero-height reader widget and zero added gap.

The generated dependency tree currently has three moderate npm audit findings in the development-server dependency chain. No forced major upgrades were applied.
