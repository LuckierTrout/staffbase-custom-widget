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

import type { BlockFactory } from "@staffbase/widget-sdk";

export const WIDGET_NAME = "staffbase-custom-widget";
export const MEDIA_ATTRIBUTE = "media-taxonomies";
export interface MediaTaxonomy { mediaId: string; taxonomyId: string; }

export function readMediaTaxonomies(raw: string | null): MediaTaxonomy[] {
  if (raw === null) return [];
  const entries: unknown = JSON.parse(raw);
  if (!Array.isArray(entries) || entries.some(entry =>
    !entry || typeof entry.mediaId !== "string" || !/^[^\s]+$/.test(entry.mediaId) || [...entry.mediaId].length > 256 ||
    typeof entry.taxonomyId !== "string" || !entry.taxonomyId.trim() || [...entry.taxonomyId].length > 256
  )) throw new Error("Invalid photo/video taxonomy entries. Each needs a Media ID and Taxonomy ID.");
  return entries;
}

export const TAXONOMY_ATTRIBUTE = "taxonomy-id";

/** Staffbase calls the reader and Studio preview hooks separately. */
export const factory: BlockFactory = (BaseBlockClass) => {
  return class ContentDetailsBlock extends BaseBlockClass {
    // Keep string IDs intact, including leading zeros and values like "false".
    public parseAttributes<T extends Record<string, unknown>>(): T {
      return { [TAXONOMY_ATTRIBUTE]: this.getAttribute(TAXONOMY_ATTRIBUTE) ?? "", [MEDIA_ATTRIBUTE]: readMediaTaxonomies(this.getAttribute(MEDIA_ATTRIBUTE)) } as unknown as T;
    }

    public parseConfig<T extends Record<string, unknown>>(attributes: T): Record<string, string> {
      const value = attributes[TAXONOMY_ATTRIBUTE];
      const media = attributes[MEDIA_ATTRIBUTE] ?? [];
      const encoded = JSON.stringify(media);
      readMediaTaxonomies(encoded);
      return { [TAXONOMY_ATTRIBUTE]: typeof value === "string" ? value : "", [MEDIA_ATTRIBUTE]: encoded };
    }

    public renderBlock(container: HTMLElement): void {
      container.replaceChildren();
      // Hide the host, including any title/card decoration inside it.
      this.style.setProperty("display", "none", "important");
    }

    public renderBlockInEditor(container: HTMLElement): void {
      // A saved hidden host must become selectable again in the editor.
      this.style.removeProperty("display");
      const preview = document.createElement("div");
      preview.style.cssText = "padding:12px 16px;border:1px dashed #64748b;border-radius:4px;background:#f8fafc;color:#243746;font:14px/1.5 Arial,sans-serif";
      const title = document.createElement("strong");
      title.textContent = "Chevron Content Details";
      const taxonomy = document.createElement("div");
      const value = this.getAttribute(TAXONOMY_ATTRIBUTE);
      taxonomy.textContent = value?.trim() ? `Taxonomy ID: ${value}` : "Set a Taxonomy ID in widget settings.";
      const hint = document.createElement("div");
      hint.textContent = "Editor only · Hidden from readers";
      preview.append(title, taxonomy);
      try {
        const entries = readMediaTaxonomies(this.getAttribute(MEDIA_ATTRIBUTE));
        for (const entry of entries) {
          const row = document.createElement("div");
          row.textContent = `Media ${entry.mediaId} → Taxonomy ID: ${entry.taxonomyId}`;
          preview.append(row);
        }
        if (new Set(entries.map(entry => entry.mediaId)).size !== entries.length) {
          const warning = document.createElement("div");
          warning.textContent = "Duplicate Media ID: keep one entry per photo/video before extracting data.";
          preview.append(warning);
        }
      } catch {
        const warning = document.createElement("div");
        warning.textContent = "Saved media details are invalid. Restore valid media-taxonomies data before editing.";
        preview.append(warning);
      }
      preview.append(hint);
      container.replaceChildren(preview);
    }

    public unmountBlock(container: HTMLElement): void {
      container.replaceChildren();
      this.style.removeProperty("display");
    }

    public static get observedAttributes(): string[] {
      return [TAXONOMY_ATTRIBUTE, MEDIA_ATTRIBUTE];
    }

    public attributeChangedCallback(...args: [string, string | undefined, string | undefined]): void {
      super.attributeChangedCallback(...args);
    }
  };
};
