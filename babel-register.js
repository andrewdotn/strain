// https://github.com/babel/babel/issues/8673
require("@babel/register")({
  extensions: [".ts", ".tsx"],
  cwd: __dirname,
  ignore: [/node_modules(?!\/@rf0)/],
  rootMode: "upward"
});
