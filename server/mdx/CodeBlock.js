let React = require('react');
let { DOM } = require('react-dom');
let { default: Highlight, defaultProps } = require('prism-react-renderer');
let theme = require('./theme');
Highlight = React.createFactory(Highlight);

let div = React.createFactory('div');
let code = React.createFactory('code');
let span = React.createFactory('span');

module.exports = ({ children, className }) => {
  const language = className && className.replace(/language-/, '');
  let x = Highlight(
    { ...defaultProps, theme: null, code: children.trim(), language: language },
    ({ className, style, tokens, getLineProps, getTokenProps }) =>
      code(
        {
          className,
          style: { ...style, display: 'block', backgroundColor: 'transparent', overflow: 'auto' }
        },
        tokens.map((line, i) =>
          div(
            {
              key: i,
              ...getLineProps({ line, key: i })
            },
            line.map((token, key) =>
              span({ key, ...getTokenProps({ token, key }) })
            )
          )
        )
      )
  );
  return x;
};
