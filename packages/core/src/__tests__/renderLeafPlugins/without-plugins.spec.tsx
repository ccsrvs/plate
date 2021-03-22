import * as React from 'react';
import { render } from '@testing-library/react';
import { createEditorPlugins } from '../../../../slate-plugins/src/utils/createEditorPlugins';
import { renderLeafPlugins } from '../../utils/renderLeafPlugins';

const attributes = {
  'data-testid': 'Leaf',
  'data-slate-leaf': true,
} as any;

const text = { text: 'test' };

it('should render the default leaf', () => {
  const Leaf = renderLeafPlugins(createEditorPlugins(), [])!;

  const { getByTestId } = render(
    <Leaf attributes={attributes} leaf={text} text={text}>
      text
    </Leaf>
  );

  expect(getByTestId('Leaf')).toHaveAttribute('data-slate-leaf', 'true');
});
