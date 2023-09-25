/**
 * @notice methods useful during testing
 * assumes tests are in currency-1.5/tests/[some directory]/<the test>
 */
import * as fs from 'fs'

function getABI(path: string) {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

export { getABI }
