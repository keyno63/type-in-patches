const MENU_TEXT_ROOT_ID = "github-comment-inserter-root-text";
const MENU_BADGE_ROOT_ID = "github-comment-inserter-root-badge";

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function normalizeBadgeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = typeof item.label === "string" ? item.label.trim() : "";
      const message = typeof item.message === "string" ? item.message.trim() : "";
      const color = typeof item.color === "string" ? item.color.trim() : "";
      if (!label || !message || !color) return null;
      return { label, message, color };
    })
    .filter(Boolean);
}

async function getItems() {
  const { menuItems, badgeItems } = await chrome.storage.sync.get({
    menuItems: ["Hello World!"],
    badgeItems: []
  });
  return {
    menuItems: normalizeItems(menuItems),
    badgeItems: normalizeBadgeItems(badgeItems)
  };
}

async function rebuildMenu() {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: MENU_TEXT_ROOT_ID,
    title: "Insert comment text",
    contexts: ["editable"]
  });

  chrome.contextMenus.create({
    id: MENU_BADGE_ROOT_ID,
    title: "Insert badge",
    contexts: ["editable"]
  });

  const { menuItems, badgeItems } = await getItems();

  if (menuItems.length === 0) {
    chrome.contextMenus.create({
      id: "empty",
      parentId: MENU_TEXT_ROOT_ID,
      title: "No items (open settings)",
      enabled: false,
      contexts: ["editable"]
    });
  } else {
    menuItems.forEach((text, index) => {
      chrome.contextMenus.create({
        id: `item-${index}`,
        parentId: MENU_TEXT_ROOT_ID,
        title: text.length > 40 ? `${text.slice(0, 40)}...` : text,
        contexts: ["editable"]
      });
    });
  }

  if (badgeItems.length === 0) {
    chrome.contextMenus.create({
      id: "badge-empty",
      parentId: MENU_BADGE_ROOT_ID,
      title: "No badges (open settings)",
      enabled: false,
      contexts: ["editable"]
    });
  } else {
    badgeItems.forEach((item, index) => {
      const label = `${item.label} - ${item.message} - ${item.color}`;
      chrome.contextMenus.create({
        id: `badge-${index}`,
        parentId: MENU_BADGE_ROOT_ID,
        title: label.length > 40 ? `${label.slice(0, 40)}...` : label,
        contexts: ["editable"]
      });
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  rebuildMenu().catch(() => {});
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.menuItems || changes.badgeItems)) {
    rebuildMenu().catch(() => {});
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;
  const { menuItems, badgeItems } = await getItems();

  if (info.menuItemId.startsWith("item-")) {
    const index = Number(info.menuItemId.replace("item-", ""));
    const text = menuItems[index];
    if (!text) return;
    chrome.tabs.sendMessage(tab.id, { type: "INSERT_TEXT", text });
    return;
  }

  if (info.menuItemId.startsWith("badge-")) {
    const index = Number(info.menuItemId.replace("badge-", ""));
    const badge = badgeItems[index];
    if (!badge) return;
    chrome.tabs.sendMessage(tab.id, { type: "INSERT_BADGE", badge });
  }
});
