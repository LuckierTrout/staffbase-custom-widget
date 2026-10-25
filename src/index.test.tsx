import { fireEvent, screen, waitFor } from "@testing-library/dom";
import "../dev/bootstrap";

test("registered form validates, applies and updates the editor and hidden reader widgets", async () => {
  document.body.innerHTML = `<div id="config"></div><div id="editor-preview"><staffbase-custom-widget></staffbase-custom-widget></div><div id="preview"><staffbase-custom-widget></staffbase-custom-widget></div>`;
  await import("./index");
  const input = await screen.findByRole("textbox", { name: /Taxonomy ID/ });
  const submit = screen.getByRole("button", { name: "Apply to preview" });
  fireEvent.change(input, { target: { value: "   " } });
  fireEvent.click(submit);
  await waitFor(() => expect(document.querySelector("#preview > staffbase-custom-widget")).not.toHaveAttribute("taxonomy-id"));
  fireEvent.change(input, { target: { value: "000123" } });
  fireEvent.click(submit);
  await waitFor(() => expect(document.querySelector("#preview > staffbase-custom-widget")).toHaveAttribute("taxonomy-id", "000123"));
  expect(document.querySelector("#preview > staffbase-custom-widget")).not.toBeVisible();
  expect(document.querySelector("#editor-preview")).toHaveTextContent("Taxonomy ID: 000123");
  fireEvent.change(input, { target: { value: "CVX-002" } });
  fireEvent.click(submit);
  await waitFor(() => expect(document.querySelector("#editor-preview")).toHaveTextContent("Taxonomy ID: CVX-002"));
  expect(screen.getByLabelText("Illustrative saved HTML")).toHaveTextContent('taxonomy-id="CVX-002"');
  expect(screen.queryByRole("button", { name: "Add Item" })).not.toBeInTheDocument();
  expect(screen.queryByText("Photos and videos in this story")).not.toBeInTheDocument();
  expect(document.querySelector("#preview > staffbase-custom-widget")).not.toHaveAttribute("media-taxonomies");
});
