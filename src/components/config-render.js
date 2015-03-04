const React = require('react');
const cookie = require('cookie');

const dom = React.DOM;
const COOKIE_AGE = 60; // seconds that side effects should last

function setCookie(name, val, age) {
  document.cookie = cookie.serialize(name, val, { maxAge: age });
}

// This renders a configuration panel to toggle server-rendering and
// apply a delay when client-rendering. This is just a fun demo to
// show how easy it is to adjust rendering.
const ConfigRender = React.createClass({
  getInitialState: function() {
    return { serverRendered: true,
             renderTimeout: '0' };
  },

  componentDidMount: function() {
    let c = cookie.parse(document.cookie);
    this.setState({ serverRendered: c.renderOnServer !== 'n',
                    renderTimeout: c.renderTimeout });

    if(c.renderConfig) {
      document.body.classList.add('show-render-config');
    }
  },

  handleRendering: function(e) {
    let checked = e.target.checked;
    setCookie('renderOnServer', checked ? 'y' : 'n', COOKIE_AGE);

    if(checked) {
      setCookie('renderTimeout', null, 0);
    }

    this.setState({ serverRendered: checked });
  },

  handleTimeout: function(e) {
    let val = e.target.value;
    if(/^\d*$/.test(val) && (!val || parseInt(val) <= 3000)) {
      this.setState({ renderTimeout: val });
      setCookie('renderTimeout', val, COOKIE_AGE);
    }
  },

  handleClose: function(e) {
    e.preventDefault();
    setCookie('renderConfig', null, 0);
    setCookie('renderOnServer', null, 0);
    setCookie('renderTimeout', null, 0);
    document.body.classList.remove('show-render-config');
    var cbox = document.getElementById('crazy-rendering-checkbox');
    if(cbox) {
      cbox.checked = false;
    }
  },

  render: function() {
    return dom.div(
      { className: 'app-config' },
      dom.a({ onClick: this.handleClose,
              href: '#',
              className: 'close' }, 'x'),
      `You can control where this site is rendered
      (on the client or the server). Check the box below and
      reload. You can `,
      dom.a({ href: 'view-source:http://localhost:4000/' }, 'view the source'),
      ' to see the difference. These settings will only persist for 1 minute.',
      dom.div({ className: 'field' },
              dom.input({ onChange: this.handleRendering,
                          checked: this.state.serverRendered,
                          type: 'checkbox' }), ' Render on Server'),
      !this.state.serverRendered && [
        `You can also apply a delay in milliseconds when the site
        is rendered on the client. This will drive home that it is fully
        rendered on the client at an arbitrary time.`,
        dom.div({ className: 'field' },
                'Delay: ',
                dom.input({ type: 'text',
                            onChange: this.handleTimeout,
                            value: this.state.renderTimeout,
                            placeholder: '1000' }),
               dom.span({ className: 'field-subtext' }, ' (max: 3000)'))
      ],
      dom.div(
        { className: 'field' },
        dom.button({ onClick: () => location.href = location.href },
                   'Reload Page'))
    );
  }
});

module.exports = ConfigRender;
