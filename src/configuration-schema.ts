/*!
 * Copyright 2026, Staffbase SE and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { UiSchema } from "@rjsf/utils";
import type { JSONSchema7 } from "json-schema";

export const configurationSchema: JSONSchema7 = {
  type: "object",
  required: ["taxonomy-id"],
  properties: {
    "media-taxonomies": {
      type: "array",
      title: "Photos and videos in this story",
      description: "Add one entry for each photo or video you want to tag. These IDs apply only within this story or page.",
      default: [],
      uniqueItems: true,
      items: {
        type: "object",
        required: ["mediaId", "taxonomyId"],
        properties: {
          mediaId: { type: "string", title: "Staffbase Media ID", minLength: 1, maxLength: 256, pattern: "^[^\\s]+$" },
          taxonomyId: { type: "string", title: "Media Taxonomy ID", minLength: 1, maxLength: 256, pattern: "\\S" },
        },
      },
    },
    "taxonomy-id": {
      type: "string",
      title: "Taxonomy ID",
      minLength: 1,
      maxLength: 256,
      pattern: "\\S",
    },
  },
};

export const uiSchema: UiSchema = {
  "ui:order": ["taxonomy-id", "media-taxonomies"],
  "media-taxonomies": {
    "ui:options": { orderable: false },
    items: {
      mediaId: { "ui:help": "Use the file's ID from the Staffbase Media API, not its filename or URL. Each Media ID should appear only once here." },
      taxonomyId: { "ui:placeholder": "CVX-PHOTO-001" },
    },
  },
  "taxonomy-id": {
    "ui:placeholder": "CVX-2026-001",
    "ui:help": "Enter the taxonomy ID for this story or page. It is hidden from readers but remains in the page data. Use one Content Details widget per language version.",
  },
};
