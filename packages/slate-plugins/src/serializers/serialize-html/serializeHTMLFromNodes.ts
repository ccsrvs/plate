import { renderToStaticMarkup } from 'react-dom/server';
import { SlatePlugin } from '@udecode/slate-plugins-core';
import { Node as SlateNode, Text as SlateText } from 'slate';
import { RenderElementProps, RenderLeafProps } from 'slate-react';
import { SlateProps } from '../../common/types/Slate.types';
import { createElementWithSlate } from '../../common/utils/createElementWithSlate';

// Remove extra whitespace generated by ReactDOMServer
const trimWhitespace = (rawHtml: string): string =>
  rawHtml.replace(/(\r\n|\n|\r|\t)/gm, '');

// Remove redundant data attributes
const stripSlateDataAttributes = (rawHtml: string): string =>
  rawHtml
    .replace(/( data-slate)(-node|-type)="[^"]+"/gm, '')
    .replace(/( data-testid)="[^"]+"/gm, '');

/**
 * Remove all class names that are not starting with `slate-`
 */
const stripClassNames = (html: string) => {
  const allClasses = html.split(/(class="[^"]*")/g);

  let filteredHtml = '';
  allClasses.forEach((item, index) => {
    if (index % 2 === 0) {
      return (filteredHtml += item);
    }
    const slateClassNames = item.match(/(slate-[^"\s]*)/g);
    if (slateClassNames) {
      filteredHtml += `class="${slateClassNames.join(' ')}"`;
    }
  });

  return filteredHtml;
};

const getNode = ({
  plugins,
  elementProps,
  slateProps,
}: {
  plugins: SlatePlugin[];
  elementProps: RenderElementProps;
  slateProps?: Partial<SlateProps>;
}) => {
  // If no type provided we wrap children with div tag
  if (!elementProps.element.type) {
    return `<div>${elementProps.children}</div>`;
  }

  let html: string | undefined;

  // Search for matching plugin based on element type
  plugins.some((plugin) => {
    if (!plugin.serialize?.element && !plugin.renderElement) return false;
    if (
      !plugin.deserialize?.element?.some(
        (item) => item.type === String(elementProps.element.type)
      )
    ) {
      html = `<div>${elementProps.children}</div>`;
      return false;
    }

    // Render element using picked plugins renderElement function and ReactDOM
    html = renderToStaticMarkup(
      createElementWithSlate({
        ...slateProps,
        children:
          plugin.serialize?.element?.(elementProps) ??
          plugin.renderElement?.(elementProps),
      })
    );

    html = stripClassNames(html);

    return true;
  });

  return html;
};

const getLeaf = ({
  plugins,
  leafProps,
  slateProps,
}: {
  plugins: SlatePlugin[];
  leafProps: RenderLeafProps;
  slateProps?: Partial<SlateProps>;
}) => {
  const { children } = leafProps;

  return plugins.reduce((result, plugin) => {
    if (!plugin.serialize?.leaf && !plugin.renderLeaf) return result;
    if (
      (plugin.serialize?.leaf?.(leafProps) ??
        plugin.renderLeaf?.(leafProps)) === children
    )
      return result;

    const newLeafProps = {
      ...leafProps,
      children: encodeURIComponent(result),
    };

    let html = decodeURIComponent(
      renderToStaticMarkup(
        createElementWithSlate({
          ...slateProps,
          children:
            plugin.serialize?.leaf?.(leafProps) ??
            plugin.renderLeaf?.(newLeafProps),
        })
      )
    );

    html = stripClassNames(html);

    return html;
  }, children);
};

const isEncoded = (str = '') => {
  try {
    return str !== decodeURIComponent(str);
  } catch (error) {
    return false;
  }
};

/**
 * Convert Slate Nodes into HTML string
 */
export const serializeHTMLFromNodes = ({
  plugins,
  nodes,
  slateProps,
  stripDataAttributes = true,
}: {
  /**
   * Plugins with renderElement or renderLeaf.
   */

  plugins: SlatePlugin[];
  /**
   * Slate nodes to convert to HTML.
   */
  nodes: SlateNode[];

  /**
   * Enable stripping data attributes
   */
  stripDataAttributes?: boolean;

  /**
   * Slate props to provide if the rendering depends on slate hooks
   */
  slateProps?: Partial<SlateProps>;
}): string => {
  let result = nodes
    .map((node: SlateNode) => {
      if (SlateText.isText(node)) {
        return getLeaf({
          plugins,
          leafProps: {
            leaf: node as SlateText,
            text: node as SlateText,
            children: isEncoded(node.text)
              ? node.text
              : encodeURIComponent(node.text),
            attributes: { 'data-slate-leaf': true },
          },
          slateProps,
        });
      }
      return getNode({
        plugins,
        elementProps: {
          element: node,
          children: encodeURIComponent(
            serializeHTMLFromNodes({
              plugins,
              nodes: node.children,
            })
          ),
          attributes: { 'data-slate-node': 'element', ref: null },
        },
        slateProps,
      });
    })
    .join('');

  result = trimWhitespace(decodeURIComponent(result));

  if (stripDataAttributes) {
    result = stripSlateDataAttributes(result);
  }

  return result;
};
