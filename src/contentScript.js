const IMAGE_SHIELDS_URL = "https://img.shields.io";

function insertTextIntoElement(element, text) {
  if (!element) return false;

  if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? element.value.length;
    element.setRangeText(text, start, end, "end");
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  if (element.isContentEditable) {
    element.focus();
    const selection = window.getSelection();
    if (!selection) return false;
    if (selection.rangeCount === 0) {
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.addRange(range);
    }
    document.execCommand("insertText", false, text);
    return true;
  }

  return false;
}

function findFallbackEditable() {
  const active = document.activeElement;
  if (active && (active.isContentEditable || active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
    return active;
  }

  const commentArea = document.querySelector(
    "textarea, [contenteditable='true'][role='textbox'], [contenteditable='true']"
  );
  return commentArea || null;
}

chrome.runtime.onMessage.addListener((message) => {
  if (!message) return;
  const target = findFallbackEditable();

  if (message.type === "INSERT_TEXT") {
    if (!insertTextIntoElement(target, message.text)) {
      console.warn("GitHub Comment Inserter: could not insert text.");
    }
  }

  if (message.type === "INSERT_BADGE") {
    const badge = message.badge;
    if (!badge) return;
    const label = encodeURIComponent(badge.label);
    const messageText = encodeURIComponent(badge.message);
    const color = encodeURIComponent(badge.color);
    const markdown = `![Static Badge](${IMAGE_SHIELDS_URL}/badge/${label}-${messageText}-${color})`;
    if (!insertTextIntoElement(target, markdown)) {
      console.warn("GitHub Comment Inserter: could not insert badge.");
    }
  }
});
