/**
 * Internal dependencies
 */
import { settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

// Need to include all the blocks involved in rendering this block.
// The main block should be the first in the array.
const blocks = [ { name: 'jetpack/rating-star', settings } ];

runBlockFixtureTests( 'jetpack/rating-star', blocks, __dirname );
