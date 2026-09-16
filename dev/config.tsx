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

import type { BaseBlock, ExternalBlockDefinition } from "@staffbase/widget-sdk";
import { configurationSchema, uiSchema } from "../src/configuration-schema";
import { TAXONOMY_ATTRIBUTE, WIDGET_NAME } from "../src/staffbase-custom-widget";
import React, { FC, useState } from "react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

type Props = { blockDefinition: ExternalBlockDefinition["blockDefinition"] };

const Config: FC<Props> = ({ blockDefinition }) => {
  const [savedHtml, setSavedHtml] = useState("");
  return (
    <>
      <h2>{blockDefinition.label}</h2>
      <Form
        schema={configurationSchema}
        uiSchema={uiSchema}
        validator={validator}
        autoComplete="off"
        onSubmit={({ formData }) => {
          const value = formData?.[TAXONOMY_ATTRIBUTE];
          if (typeof value !== "string") return;
          const previewWidget = document.querySelector(`#preview > ${WIDGET_NAME}`) as BaseBlock;
          const attributes = previewWidget.parseConfig(formData);
          document.querySelectorAll(`#preview > ${WIDGET_NAME}, #editor-preview > ${WIDGET_NAME}`).forEach((widget) => {
            Object.entries(attributes).forEach(([name, value]) => widget.setAttribute(name, value));
          });
          // Illustrate the saved attribute contract without runtime decoration.
          const template = document.createElement("template");
          template.innerHTML = `<${WIDGET_NAME}></${WIDGET_NAME}>`;
          const widget = template.content.firstElementChild!;
          Object.entries(attributes).forEach(([name, value]) => widget.setAttribute(name, value));
          setSavedHtml(widget.outerHTML);
        }}
      >
        <button type="submit">Apply to preview</button>
      </Form>
      <p className="muted">Local preview only. Changes reset on reload.</p>
      <h3>Illustrative saved HTML</h3>
      <pre aria-label="Illustrative saved HTML">{savedHtml || "Apply a taxonomy ID to see its attribute."}</pre>
      <p className="muted">This demonstrates the attribute format. A real Staffbase API response still needs to be checked.</p>
    </>
  );
};

export default Config;
