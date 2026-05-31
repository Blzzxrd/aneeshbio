const yearElement = document.querySelector("#year");
const contactForm = document.querySelector(".contact-form");
const formNote = document.querySelector(".form-note");
const writeupList = document.querySelector("[data-writeup-list]");
const writeupTitle = document.querySelector("[data-writeup-title]");
const writeupStatus = document.querySelector("[data-writeup-status]");
const writeupContent = document.querySelector("[data-writeup-content]");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

if (contactForm && formNote) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formNote.textContent = "Message placeholder received. Add a real form service later.";
  });
}

const cleanFileName = (name) =>
  name
    .replace(/\.docx$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getConfig = () => ({
  folder: "writeups",
  branch: "main",
  ...(window.WRITEUPS_CONFIG || {})
});

const getGithubDetails = () => {
  const config = getConfig();

  if (config.owner && config.repo) {
    return config;
  }

  if (!location.hostname.endsWith("github.io")) {
    return null;
  }

  const owner = location.hostname.replace(".github.io", "");
  const firstPathPart = location.pathname.split("/").filter(Boolean)[0];
  const repo = firstPathPart || `${owner}.github.io`;
  const sitePrefix = firstPathPart ? `/${firstPathPart}/` : "/";

  return { ...config, owner, repo, sitePrefix };
};

const normalizeWriteup = (entry) => ({
  name: entry.name,
  title: entry.title || cleanFileName(entry.name),
  path: entry.path || entry.download_url || `${getConfig().folder}/${entry.name}`,
  downloadUrl: entry.download_url || entry.path || `${getConfig().folder}/${entry.name}`
});

const fromLocalDirectory = async () => {
  if (!["localhost", "127.0.0.1"].includes(location.hostname)) {
    return [];
  }

  const folder = getConfig().folder;
  const response = await fetch(`${folder}/`);
  if (!response.ok) {
    return [];
  }

  const html = await response.text();
  const documentFragment = new DOMParser().parseFromString(html, "text/html");

  return [...documentFragment.querySelectorAll("a")]
    .map((link) => decodeURIComponent(link.getAttribute("href") || ""))
    .filter((href) => href.toLowerCase().endsWith(".docx"))
    .map((name) => normalizeWriteup({ name, path: `${folder}/${name}` }));
};

const fromGithubApi = async () => {
  const details = getGithubDetails();
  if (!details) {
    return [];
  }

  const apiUrl = `https://api.github.com/repos/${details.owner}/${details.repo}/contents/${details.folder}?ref=${details.branch}`;
  const response = await fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } });

  if (!response.ok) {
    return [];
  }

  const items = await response.json();
  return items
    .filter((item) => item.type === "file" && item.name.toLowerCase().endsWith(".docx"))
    .map((item) => normalizeWriteup(item));
};

const fromManifest = async () => {
  const folder = getConfig().folder;
  const response = await fetch(`${folder}/manifest.json`);
  if (!response.ok) {
    return [];
  }

  const items = await response.json();
  return items
    .filter((item) => item.name && item.name.toLowerCase().endsWith(".docx"))
    .map((item) => normalizeWriteup(item));
};

const loadWriteupList = async () => {
  const sources = [fromLocalDirectory, fromGithubApi, fromManifest];

  for (const source of sources) {
    try {
      const writeups = await source();
      if (writeups.length > 0) {
        return writeups.sort((a, b) => a.title.localeCompare(b.title));
      }
    } catch (error) {
      console.warn("Writeup source failed:", error);
    }
  }

  return [];
};

const renderWriteup = async (writeup, button) => {
  if (!window.mammoth) {
    writeupStatus.textContent = "The DOCX renderer could not load. Check your connection and try again.";
    return;
  }

  document.querySelectorAll(".writeup-button").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  writeupTitle.textContent = writeup.title;
  writeupStatus.textContent = "Loading document...";
  writeupContent.innerHTML = "";

  try {
    const response = await fetch(writeup.downloadUrl);
    if (!response.ok) {
      throw new Error(`Could not load ${writeup.name}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer });
    writeupContent.innerHTML = result.value || "<p>This document did not contain readable content.</p>";
    writeupStatus.textContent = "Rendered from DOCX.";
  } catch (error) {
    writeupStatus.textContent = "This writeup could not be loaded yet.";
    writeupContent.innerHTML = `<p class="empty-state">${error.message}</p>`;
  }
};

const initWriteups = async () => {
  if (!writeupList || !writeupTitle || !writeupStatus || !writeupContent) {
    return;
  }

  const writeups = await loadWriteupList();
  writeupList.innerHTML = "";

  if (writeups.length === 0) {
    writeupTitle.textContent = "No writeups yet";
    writeupStatus.textContent = "Add `.docx` files to the `writeups` folder.";
    writeupList.innerHTML = '<p class="empty-state">No `.docx` files found.</p>';
    return;
  }

  writeups.forEach((writeup, index) => {
    const button = document.createElement("button");
    button.className = "writeup-button";
    button.type = "button";
    button.textContent = writeup.title;
    button.addEventListener("click", () => renderWriteup(writeup, button));
    writeupList.appendChild(button);

    if (index === 0) {
      renderWriteup(writeup, button);
    }
  });
};

initWriteups();
