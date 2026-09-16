import type { BaseBlock } from "@staffbase/widget-sdk";
import { factory } from "./staffbase-custom-widget";
import WidgetApiMock from "../dev/widget-api-mock";

class HostMock extends HTMLElement {
  attributeChangedCallback() { /* Simulated host; explicit rendering in tests. */ }
}
const WidgetClass = factory(HostMock as unknown as new () => BaseBlock, WidgetApiMock);
customElements.define("content-details-unit-test", WidgetClass);
const createWidget = () => document.createElement("content-details-unit-test") as BaseBlock;

afterEach(() => document.body.replaceChildren());

test("hides the host and its decorations for readers; restores it in the editor", () => {
  const widget = createWidget();
  const card = document.createElement("div");
  const container = document.createElement("div");
  card.textContent = "Host card title";
  widget.append(card, container);
  document.body.append(widget);
  widget.setAttribute("taxonomy-id", "CVX-001");
  widget.renderBlockInEditor(container);
  expect(widget).toBeVisible();
  expect(container).toHaveTextContent("Taxonomy ID: CVX-001");
  widget.renderBlock(container);
  expect(widget).not.toBeVisible();
  expect(container).toBeEmptyDOMElement();
  expect(widget.getAttribute("taxonomy-id")).toBe("CVX-001");
  widget.renderBlockInEditor(container);
  expect(widget).toBeVisible();
  expect(container).toHaveTextContent("Editor only");
});

test.each(["000123", "false", 'R&D "東京" <img src=x onerror=alert(1)>'])
("preserves %s through config, HTML serialization and reopening", (value) => {
  const widget = createWidget();
  const config = widget.parseConfig({ "taxonomy-id": value });
  widget.setAttribute("taxonomy-id", config["taxonomy-id"]);
  widget.renderBlock(widget);
  const template = document.createElement("template");
  template.innerHTML = widget.outerHTML;
  const restored = template.content.firstElementChild! as BaseBlock;
  // Adopt the saved element to activate its custom-element implementation.
  document.body.append(restored);
  restored.renderBlockInEditor(restored);
  expect(restored.parseAttributes()["taxonomy-id"]).toBe(value);
  expect(restored).toHaveTextContent(value);
  expect(restored.querySelector("img,script")).toBeNull();
  expect(restored).toBeVisible();
});

test("clearing removes old values; an empty editor preview remains actionable", () => {
  const widget = createWidget();
  widget.setAttribute("taxonomy-id", "OLD");
  widget.setAttribute("taxonomy-id", widget.parseConfig({})["taxonomy-id"]);
  widget.renderBlockInEditor(widget);
  expect(widget).toHaveTextContent("Set a Taxonomy ID");
  expect(widget.parseAttributes()["taxonomy-id"]).toBe("");
  widget.unmountBlock(widget);
  expect(widget).toBeEmptyDOMElement();
});


test("media entries survive serialization, reopening, editing and removing the last entry", () => {
  const widget = createWidget();
  document.body.append(widget);
  const entries = [{mediaId:"photo-1",taxonomyId:"000123"},{mediaId:"video-1",taxonomyId:'R&D "東京" <img src=x>'}];
  const config = widget.parseConfig({"taxonomy-id":"STORY", "media-taxonomies":entries});
  Object.entries(config).forEach(([key,value]) => widget.setAttribute(key,value));
  const template = document.createElement("template");
  template.innerHTML = widget.outerHTML;
  const restored = template.content.firstElementChild! as BaseBlock;
  document.body.append(restored);
  expect(restored.parseAttributes()["media-taxonomies"]).toEqual(entries);
  restored.renderBlockInEditor(restored);
  expect(restored).toHaveTextContent("Media photo-1 → Taxonomy ID: 000123");
  expect(restored.querySelector("img")).toBeNull();
  restored.renderBlock(restored);
  expect(restored).not.toBeVisible();
  expect(restored).toBeEmptyDOMElement();
  restored.setAttribute("media-taxonomies", restored.parseConfig({"media-taxonomies":[]})["media-taxonomies"]);
  expect(restored.parseAttributes()["media-taxonomies"]).toEqual([]);
});

test("malformed media data is reported without exposing it to readers", () => {
  const widget = createWidget();
  widget.setAttribute("media-taxonomies", "broken");
  expect(() => widget.parseAttributes()).toThrow();
  widget.renderBlockInEditor(widget);
  expect(widget).toHaveTextContent("Saved media details are invalid");
  widget.renderBlock(widget);
  expect(widget).toBeEmptyDOMElement();
});
