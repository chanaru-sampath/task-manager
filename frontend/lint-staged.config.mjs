/**
 * @filename: lint-staged.config.mjs
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*': ['prettier --write --ignore-unknown', 'eslint .'],
}
