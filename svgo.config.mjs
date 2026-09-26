// SVGO config for hand-authored illustration. Keeps ids and groups that GSAP targets
// (anything with an id or a data-* attribute) and never merges paths, because
// DrawSVG / MorphSVG need the original path structure.
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          mergePaths: false,
          collapseGroups: false,
          convertShapeToPath: false,
          removeViewBox: false,
        },
      },
    },
    'removeDimensions',
  ],
}
