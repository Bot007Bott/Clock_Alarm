/**
 * tab.js – simple tab navigation for the Clock Suite.
 * The header contains buttons with data-tab attributes. Panels have matching data-panel attributes.
 */
export function initTabs() {
  const tabBar = document.getElementById('tab-bar');
  const tabs = tabBar.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  const showPanel = (name) => {
    panels.forEach(p => {
      if (p.dataset.panel === name) {
        p.classList.remove('hidden');
      } else {
        p.classList.add('hidden');
      }
    });
    tabs.forEach(t => {
      if (t.dataset.tab === name) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
  };

  // Attach click listeners
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      showPanel(name);
    });
  });

  // Make sure the default (first) tab is shown on load
  const defaultTab = tabs[0]?.dataset.tab;
  if (defaultTab) showPanel(defaultTab);
}
