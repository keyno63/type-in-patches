const list = document.getElementById("items-list");
const badgeList = document.getElementById("badge-list");
const addButton = document.getElementById("add-item");
const addBadgeButton = document.getElementById("add-badge");
const saveButtons = document.querySelectorAll("[data-action='save']");
const status = document.getElementById("status");

function createItemRow(value = "") {
  const li = document.createElement("li");
  li.className = "item";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Text to insert";
  input.value = value;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "ghost";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => {
    li.remove();
  });

  li.appendChild(input);
  li.appendChild(remove);
  return li;
}

function createBadgeRow(value = { label: "", message: "", color: "" }) {
  const li = document.createElement("li");
  li.className = "item badge-item";

  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.placeholder = "label";
  labelInput.value = value.label ?? "";

  const messageInput = document.createElement("input");
  messageInput.type = "text";
  messageInput.placeholder = "message";
  messageInput.value = value.message ?? "";

  const colorInput = document.createElement("input");
  colorInput.type = "text";
  colorInput.placeholder = "color (e.g. blue or %23fff)";
  colorInput.value = value.color ?? "";

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "ghost";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => {
    li.remove();
  });

  li.appendChild(labelInput);
  li.appendChild(messageInput);
  li.appendChild(colorInput);
  li.appendChild(remove);
  return li;
}

function readItemsFromUI() {
  const values = [];
  list.querySelectorAll("input").forEach((input) => {
    const trimmed = input.value.trim();
    if (trimmed.length > 0) values.push(trimmed);
  });
  return values;
}

function readBadgesFromUI() {
  const values = [];
  badgeList.querySelectorAll(".badge-item").forEach((row) => {
    const inputs = row.querySelectorAll("input");
    if (inputs.length < 3) return;
    const label = inputs[0].value.trim();
    const message = inputs[1].value.trim();
    const color = inputs[2].value.trim();
    if (label && message && color) {
      values.push({ label, message, color });
    }
  });
  return values;
}

function setStatus(message) {
  status.textContent = message;
  if (message) {
    window.setTimeout(() => {
      status.textContent = "";
    }, 2000);
  }
}

async function loadItems() {
  const { menuItems, badgeItems } = await chrome.storage.sync.get({
    menuItems: ["Hello World!"],
    badgeItems: []
  });
  list.innerHTML = "";
  menuItems.forEach((item) => list.appendChild(createItemRow(item)));
  badgeList.innerHTML = "";
  badgeItems.forEach((item) => badgeList.appendChild(createBadgeRow(item)));
}

addButton.addEventListener("click", () => {
  list.appendChild(createItemRow(""));
});

addBadgeButton.addEventListener("click", () => {
  badgeList.appendChild(createBadgeRow());
});

saveButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const items = readItemsFromUI();
    const badges = readBadgesFromUI();
    await chrome.storage.sync.set({ menuItems: items, badgeItems: badges });
    setStatus("Saved");
  });
});

loadItems().catch(() => setStatus("Failed to load settings"));
