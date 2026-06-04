const localContent = document.body.dataset.localContent || "/content";
const remoteContent = document.body.dataset.remoteContent || "https://solaris.ink/content";
const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const contentUrl = isLocal ? localContent : remoteContent;

let activeVideo = 0;
let siteContent = null;

const routeMap = {
  "/": "home",
  "/docs/": "docs",
  "/faq/": "faq",
  "/download/": "download"
};

const currentRoute = routeMap[window.location.pathname] || "home";

const iconPaths = {
  windows: '<path d="M3 5.5 11 4v8H3V5.5ZM12 3.85l9-1.35V11h-9V3.85ZM3 13h8v7.5L3 19V13Zm9 0h9v8l-9-1.35V13Z"></path>',
  play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>',
  discord: '<path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.35 12.35 0 0 0-.618-1.25.077.077 0 0 0-.078-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.533 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.128c-.598.343-1.22.645-1.873.891a.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419s.956-2.419 2.157-2.419c1.211 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419s.955-2.419 2.157-2.419c1.211 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419Z"></path>',
  android: '<path d="M17.6 9.48 19.44 6.3a.38.38 0 0 0-.66-.38l-1.86 3.22a11.43 11.43 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.68 10.68 0 0 0 2 18h20a10.68 10.68 0 0 0-4.4-8.52ZM7.5 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm9 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>'
};

const getValue = (source, path) => path.split(".").reduce((value, key) => value?.[key], source);

const setText = (content) => {
  document.querySelectorAll("[data-text]").forEach((node) => {
    const value = getValue(content, node.dataset.text);
    if (typeof value === "string") node.textContent = value;
  });
};

const setLinks = (links = {}) => {
  document.querySelectorAll("[data-link]").forEach((node) => {
    const href = links[node.dataset.link];
    if (href) node.href = href;
  });
};

const svgIcon = (name, size = 20) => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    ${iconPaths[name] || iconPaths.play}
  </svg>
`;

const buttonMarkup = (button, options = {}) => {
  const href = options.href || button.href;
  const attrs = options.scroll ? "data-scroll-download" : button.external ? 'target="_blank" rel="noreferrer"' : "";

  return `
    <a class="launcher-button ${button.primary ? "launcher-button--primary" : ""}" href="${href}" ${attrs}>
      ${svgIcon(button.icon)}
      <span class="launcher-button__text">
        <span class="launcher-button__title">${button.title}</span>
        <span class="launcher-button__meta">${button.meta}</span>
      </span>
    </a>
  `;
};

const renderButtons = (buttons = []) => {
  const primary = buttons[0];
  const groups = `
    ${buttonMarkup(primary)}
    <div class="download-row">
      ${buttons.slice(1).map((button) => buttonMarkup(button)).join("")}
    </div>
  `;

  document.querySelector("#homeButton").innerHTML = buttonMarkup(primary, {
    href: "/?download",
    scroll: true
  });
  document.querySelector("#downloadButtons").innerHTML = groups;
};

const renderFeatureVideo = () => {
  const video = siteContent.media.items[activeVideo];
  document.querySelector("#featureVideo").innerHTML = `
    <div class="feature-video__poster" style="background-image: url('${video.thumbnail}')"></div>
    <a class="play-button" href="${video.url}" target="_blank" rel="noreferrer" aria-label="Play ${video.title}">
      <span class="play-button__disc">${svgIcon("play", 34)}</span>
    </a>
    <div class="feature-video__caption">
      <div class="meta">${video.platform} · ${video.type} · ${video.year}</div>
      <h3>${video.title}</h3>
    </div>
  `;
};

const renderVideoList = () => {
  const target = document.querySelector("#videoList");
  target.innerHTML = siteContent.media.items
    .map(
      (video, index) => `
        <li>
          <button class="video-item ${index === activeVideo ? "is-active" : ""}" type="button" data-video="${index}">
            <span class="video-item__thumb" style="background-image: url('${video.smallThumbnail || video.thumbnail}')"></span>
            <span class="video-item__copy">
              <span class="meta">${video.platform} · ${video.type} · ${video.year}</span>
              <strong>${video.title}</strong>
            </span>
          </button>
        </li>
      `
    )
    .join("");

  target.querySelectorAll("[data-video]").forEach((button) => {
    button.addEventListener("click", () => {
      activeVideo = Number(button.dataset.video);
      renderFeatureVideo();
      renderVideoList();
    });
  });
};

const renderFaq = (items = []) => {
  const target = document.querySelector("#faqList");
  target.innerHTML = items
    .map(
      (item, index) => `
        <article class="faq-item ${index === 0 ? "is-open" : ""}">
          <button class="faq-trigger" type="button" aria-expanded="${index === 0}">
            <strong>${item.question}</strong>
            <span aria-hidden="true">+</span>
          </button>
          <div class="faq-panel">${item.answer}</div>
        </article>
      `
    )
    .join("");

  target.querySelectorAll(".faq-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const item = trigger.closest(".faq-item");
      const isOpen = item.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(isOpen));
    });
  });
};

const renderDocs = (docs = {}) => {
  document.querySelector("#docTimeline").innerHTML = (docs.items || [])
    .map(
      (item, index) => `
        <article class="doc-card" style="--delay: ${index * 80}ms">
          <span class="doc-card__dot"></span>
          <div class="doc-card__content">
            <div class="meta">${item.phase}</div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </div>
        </article>
      `
    )
    .join("");
};

const scrollToDownload = () => {
  const target = document.querySelector("#downloadPanel h2") || document.querySelector("#downloadPanel");
  if (!target) return;
  window.scrollTo({
    top: window.scrollY + target.getBoundingClientRect().top - 130,
    behavior: "smooth"
  });
};

const bindDownloadScroll = () => {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-scroll-download]");
    if (!link || window.location.pathname !== "/") return;
    event.preventDefault();
    document.body.classList.remove("nav-open");
    document.querySelector(".menu-button")?.setAttribute("aria-expanded", "false");
    scrollToDownload();
    history.replaceState(null, "", "/");
  }, true);

  if (currentRoute === "home" && new URLSearchParams(window.location.search).has("download")) {
    window.setTimeout(() => {
      history.replaceState(null, "", "/");
      scrollToDownload();
    }, 80);
  }
};

const bindHeader = () => {
  const header = document.querySelector("#siteHeader");
  const menuButton = document.querySelector(".menu-button");
  const links = [...document.querySelectorAll(".desktop-nav a, .mobile-menu a")];

  const updateHeader = () => {
    const showOnHome = currentRoute === "home" && window.scrollY > 14;
    const showOnPage = currentRoute !== "home";
    header.classList.toggle("is-visible", showOnHome || showOnPage);
    header.classList.toggle("is-solid", window.scrollY > 80 || showOnPage);
  };

  menuButton.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  links.forEach((link) => {
    const linkPath = new URL(link.href).pathname;
    link.classList.toggle("is-active", (routeMap[linkPath] || "home") === currentRoute);
    link.addEventListener("click", () => {
      document.body.classList.remove("nav-open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
};

const applyRoute = () => {
  document.body.dataset.page = currentRoute;
  const visibleByRoute = {
    home: ["home", "download"],
    download: ["download"],
    docs: ["docs"],
    faq: ["faq"]
  };
  const visibleRoutes = visibleByRoute[currentRoute] || ["home"];

  document.querySelectorAll(".route-view").forEach((section) => {
    section.hidden = !visibleRoutes.includes(section.dataset.route);
  });

  const titles = {
    home: "Solaris",
    docs: "Solaris Doc",
    faq: "Solaris FAQ",
    download: "Solaris Download"
  };
  document.title = titles[currentRoute] || "Solaris";
};

const loadContent = async () => {
  const response = await fetch(contentUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("Content could not be loaded");
  return response.json();
};

const boot = async () => {
  try {
    applyRoute();
    siteContent = await loadContent();
    setText(siteContent);
    setLinks(siteContent.links);
    renderButtons(siteContent.buttons);
    renderFeatureVideo();
    renderVideoList();
    renderFaq(siteContent.faq.items);
    renderDocs(siteContent.docs);
  } catch (error) {
    console.error(error);
  } finally {
    bindHeader();
    bindDownloadScroll();
  }
};

boot();
