/** @jsx jsx */

import { withInlineVoid } from '@udecode/slate-plugins-core';
import { jsx } from '@udecode/slate-plugins-test-utils';
import { Editor } from 'slate';
import { ELEMENT_LINK } from '../../../../../elements/link/src/defaults';
import { isBlockTextEmptyAfterSelection } from '../../../queries/isBlockTextEmptyAfterSelection';

const input = ((
  <editor>
    <hp>
      <htext>first</htext>
      <ha>
        test
        <cursor />
      </ha>
    </hp>
  </editor>
) as any) as Editor;

const output = true;

it('should be', () => {
  expect(
    isBlockTextEmptyAfterSelection(
      withInlineVoid({ inlineTypes: [ELEMENT_LINK] })(input)
    )
  ).toEqual(output);
});
