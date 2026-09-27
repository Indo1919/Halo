/* Connector marks, drawn as simplified 24px renditions for identification only.
   Product names and logos belong to their respective owners. */
(function (H) {
  'use strict';
  var slackArm = '<rect x="2.6" y="7" width="8" height="3.4" rx="1.7"/><rect x="7.2" y="2.6" width="3.4" height="3.4" rx="1.7"/>';
  var loomPetal = '<rect x="10.4" y="2.5" width="3.2" height="19" rx="1.6"/>';
  var B = {
    gcal: { name: 'Google Calendar', hue: '#4285F4',
      svg: '<rect x="3" y="3" width="18" height="18" rx="3.2" fill="#fff"/><path d="M6.2 3h11.6A3.2 3.2 0 0 1 21 6.2V7H3v-.8A3.2 3.2 0 0 1 6.2 3z" fill="#4285F4"/><path d="M3 7h2.2v11.8H3z" fill="#1967D2"/><path d="M5.2 18.8H16.6V21H6.2A3.2 3.2 0 0 1 3 17.8v-.1h2.2z" fill="#34A853"/><path d="M18.8 7H21v9.4h-2.2z" fill="#FBBC04"/><path d="M16.6 21 21 16.4v1.4A3.2 3.2 0 0 1 17.8 21z" fill="#EA4335"/><path d="M16.6 16.4H21L16.6 21z" fill="#EA4335" opacity=".75"/><path d="M8.3 10.6c.25-.8.95-1.3 1.8-1.3 1 0 1.75.62 1.75 1.5 0 .82-.66 1.35-1.55 1.35.98 0 1.75.55 1.75 1.5 0 .95-.82 1.6-1.9 1.6-.9 0-1.6-.5-1.85-1.25M14 10.1l1.25-.8v5.9" fill="none" stroke="#4285F4" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>' },
    gmail: { name: 'Gmail', hue: '#EA4335',
      svg: '<path d="M3.5 7.6v9.9A1.5 1.5 0 0 0 5 19h2.75V10z" fill="#4285F4"/><path d="M20.5 7.6v9.9A1.5 1.5 0 0 1 19 19h-2.75V10z" fill="#34A853"/><path d="M7.75 6.7 12 9.9l4.25-3.2V10L12 13.2 7.75 10z" fill="#EA4335"/><path d="M3.5 7.6a2 2 0 0 1 3.2-1.6l1.05.7V10L3.5 6.9z" fill="#C5221F"/><path d="M20.5 7.6a2 2 0 0 0-3.2-1.6l-1.05.7V10l4.25-3.1z" fill="#FBBC04"/>' },
    slack: { name: 'Slack', hue: '#4A154B',
      svg: '<g fill="#36C5F0">' + slackArm + '</g><g fill="#2EB67D" transform="rotate(90 12 12)">' + slackArm + '</g><g fill="#ECB22E" transform="rotate(180 12 12)">' + slackArm + '</g><g fill="#E01E5A" transform="rotate(270 12 12)">' + slackArm + '</g>' },
    zoom: { name: 'Zoom', hue: '#0B5CFF',
      svg: '<rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="#0B5CFF"/><rect x="5.6" y="8.3" width="8.6" height="7.4" rx="1.9" fill="#fff"/><path d="m15 11 3-2.1a.5.5 0 0 1 .8.4v5.4a.5.5 0 0 1-.8.4L15 13z" fill="#fff"/>' },
    github: { name: 'GitHub', hue: '#24292F', dark: true,
      svg: '<g transform="translate(2.4 2.4) scale(.8)"><path fill="var(--brand-fg, #181717)" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></g>' },
    figma: { name: 'Figma', hue: '#A259FF',
      svg: '<path d="M12 3.75H9.25a2.75 2.75 0 0 0 0 5.5H12z" fill="#F24E1E"/><path d="M12 3.75h2.75a2.75 2.75 0 0 1 0 5.5H12z" fill="#FF7262"/><path d="M12 9.25H9.25a2.75 2.75 0 0 0 0 5.5H12z" fill="#A259FF"/><circle cx="14.75" cy="12" r="2.75" fill="#1ABCFE"/><path d="M12 14.75H9.25a2.75 2.75 0 1 0 2.75 2.75z" fill="#0ACF83"/>' },
    jira: { name: 'Jira', hue: '#0052CC',
      svg: '<g transform="translate(3 3) scale(.75)"><path fill="#0052CC" d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005z"/><path fill="#2684FF" d="M17.294 5.757H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001z"/><path fill="#2684FF" d="M23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0z"/></g>' },
    linear: { name: 'Linear', hue: '#5E6AD2',
      svg: '<circle cx="12" cy="12" r="9" fill="#5E6AD2"/><path d="M3.9 14.6 9.4 20.1M3.2 11.1l9.7 9.7M3.9 7.5 16.5 20.1" stroke="var(--tile-bg, #fff)" stroke-width="1.35" stroke-linecap="round"/>' },
    notion: { name: 'Notion', hue: '#191919',
      svg: '<path d="M5.6 3.9 15.9 3.1c.95-.08 1.45.1 2.05.55l2.3 1.62c.42.3.6.62.6 1.15v12.2c0 .82-.4 1.3-1.3 1.36L8.1 20.75c-.66.04-1-.06-1.35-.5L4.4 17.3c-.4-.5-.55-.9-.55-1.4V5.5c0-.72.34-1.52 1.75-1.6z" fill="#fff" stroke="#191919" stroke-width="1.25" stroke-linejoin="round"/><path d="M8.9 8.9v8.2M8.9 8.9l6.3 8.4V8.7" fill="none" stroke="#191919" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>' },
    gdocs: { name: 'Google Docs', hue: '#1A73E8',
      svg: '<path d="M6.3 2.8h7.1L19 8.4v11.4a1.4 1.4 0 0 1-1.4 1.4H6.3a1.4 1.4 0 0 1-1.4-1.4V4.2a1.4 1.4 0 0 1 1.4-1.4z" fill="#1A73E8"/><path d="M13.4 2.8 19 8.4h-4.2a1.4 1.4 0 0 1-1.4-1.4z" fill="#A8C7FA"/><path d="M8.3 12h7.4M8.3 14.8h7.4M8.3 17.6h4.6" stroke="#fff" stroke-width="1.25" stroke-linecap="round"/>' },
    loom: { name: 'Loom', hue: '#625DF5',
      svg: '<g fill="#625DF5">' + loomPetal + '<g transform="rotate(45 12 12)">' + loomPetal + '</g><g transform="rotate(90 12 12)">' + loomPetal + '</g><g transform="rotate(135 12 12)">' + loomPetal + '</g></g><circle cx="12" cy="12" r="3.1" fill="var(--tile-bg, #fff)"/>' },
    ai: { name: 'AI assistants', hue: '#7C5CFF',
      svg: '<path d="M11 3.2c.5 4.6 2.4 6.5 7 7-4.6.5-6.5 2.4-7 7-.5-4.6-2.4-6.5-7-7 4.6-.5 6.5-2.4 7-7z" fill="#7C5CFF"/><path d="M18.2 14.6c.24 2 1 2.76 3 3-2 .24-2.76 1-3 3-.24-2-1-2.76-3-3 2-.24 2.76-1 3-3z" fill="#B7A6FF"/>' },
    outlook: { name: 'Outlook', hue: '#0F6CBD',
      svg: '<rect x="8.5" y="5" width="13" height="14" rx="1.8" fill="#28A8EA"/><path d="m8.5 8.2 6.5 4.3 6.5-4.3" fill="none" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/><rect x="2.5" y="6.5" width="10.5" height="11" rx="1.9" fill="#0F6CBD"/><ellipse cx="7.75" cy="12" rx="2.35" ry="2.9" fill="none" stroke="#fff" stroke-width="1.5"/>' },
    teams: { name: 'Microsoft Teams', hue: '#5B5FC7',
      svg: '<circle cx="17.6" cy="6.9" r="2.2" fill="#7B83EB"/><path d="M14.4 10.1h6.1a1 1 0 0 1 1 1v3.6a3.55 3.55 0 0 1-7.1 0z" fill="#7B83EB"/><rect x="2.5" y="6.2" width="11.2" height="11.6" rx="2" fill="#5B5FC7"/><path d="M5.6 9.6h5M8.1 9.6v5.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>' },
    asana: { name: 'Asana', hue: '#F06A6A',
      svg: '<circle cx="12" cy="7.4" r="3.7" fill="#F06A6A"/><circle cx="6.9" cy="15.6" r="3.7" fill="#F06A6A"/><circle cx="17.1" cy="15.6" r="3.7" fill="#F06A6A"/>' },
    halo: { name: 'Halo', hue: '#FF4405',
      svg: '<path d="M19.25 12a7.25 7.25 0 1 1-7.9-7.22" fill="none" stroke="var(--text)" stroke-width="2.4"/><path d="M13.3 4.9a7.25 7.25 0 0 1 5.8 5.8" fill="none" stroke="#FF4405" stroke-width="2.4"/>' }
  };
  H.brands = B;
  // Tile: soft brand-hued square with the mark. size = outer px.
  H.brandMark = function (id, size) {
    var b = B[id]; size = size || 20;
    if (!b) return H.icon('sources', size);
    return '<svg class="bm" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true">' + b.svg + '</svg>';
  };
  H.brandTile = function (id, size, cls) {
    var b = B[id] || { hue: '#888' }; size = size || 36;
    return '<span class="brand-tile' + (cls ? ' ' + cls : '') + '" style="--hue:' + b.hue + ';width:' + size + 'px;height:' + size + 'px">' +
      H.brandMark(id, Math.round(size * 0.62)) + '</span>';
  };
})(window.H = window.H || {});
