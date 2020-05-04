let React = require('react');

let div = React.createFactory('div');

module.exports = function HypeAnimation({ url }) {
  return div({
    dangerouslySetInnerHTML: {
      __html: `
<div style="padding-bottom: 75%; position: relative">
  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0">
	  <div id="budgetpage_hype_container" class="HYPE_document" style="margin:auto;position:relative;width:100%;height:100%;overflow:hidden;">
		<script type="text/javascript" charset="utf-8" src=${url}></script>
	  </div>
  </div>
</div>`
    }
  });
};
