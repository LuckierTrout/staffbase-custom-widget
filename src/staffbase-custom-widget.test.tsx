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
  expect(container).toHaveTextContent("Taxonomy ID: CVX-001");
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

test("editor reminder changes from red to green and back when the value is removed", () => {
  const widget = createWidget();
  const container = document.createElement("div");
  for (const value of [null, "", "   ", "000123", ""]) {
    if (value === null) widget.removeAttribute("taxonomy-id");
    else widget.setAttribute("taxonomy-id", value);
    widget.renderBlockInEditor(container);
    if (value === "000123") {
      expect(container).toHaveTextContent("Taxonomy ID added");
      expect(container).toHaveTextContent("Taxonomy ID: 000123");
      expect(container.firstElementChild).toHaveStyle({ background: "#f0fdf4", color: "#166534" });
    } else {
      expect(container).toHaveTextContent("Taxonomy ID missing");
      expect(container).toHaveTextContent("Set a Taxonomy ID in widget settings before publishing.");
      expect(container.firstElementChild).toHaveStyle({ background: "#fef2f2", color: "#991b1b" });
      expect(container).not.toHaveTextContent("000123");
    }
  }
});
