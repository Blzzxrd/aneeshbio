const explorer = document.querySelector("#explorer");
const button = document.querySelector("#explore-button");

if (button && explorer) {
  let orbitFrame;
  let lastSparkle = 0;
  const entryPrompt = "Hey, I’m Aneesh — click to explore";
  button.querySelector(".dot-label").textContent = entryPrompt;
  button.setAttribute("aria-label", entryPrompt);

  if (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    window.addEventListener("pointermove", (event) => {
      const now = performance.now();
      if (now - lastSparkle < 34) return;
      lastSparkle = now;

      const sparkle = document.createElement("span");
      sparkle.className = "cursor-sparkle";
      sparkle.style.left = `${event.clientX}px`;
      sparkle.style.top = `${event.clientY}px`;
      sparkle.style.setProperty("--drift-x", `${Math.round((Math.random() - 0.5) * 30)}px`);
      sparkle.style.setProperty("--drift-y", `${Math.round(12 + Math.random() * 26)}px`);
      document.body.append(sparkle);
      window.setTimeout(() => sparkle.remove(), 720);
    });
  }

  const stopOrbit = () => {
    cancelAnimationFrame(orbitFrame);
    orbitFrame = undefined;
    document.querySelectorAll(".orbit-link").forEach((link) => {
      link.style.transform = "";
    });
  };

  const startOrbit = () => {
    stopOrbit();
    if (window.matchMedia("(max-width: 1200px)").matches) return;

    const links = [...document.querySelectorAll(".orbit-link")];
    // A wide constellation reads more like a true orbit and keeps adjacent
    // cards apart along the horizontal axis.
    const cx = innerWidth * 0.755;
    const cy = innerHeight * 0.54;
    const rx = Math.min(220, innerWidth * 0.17);
    const ry = Math.min(195, Math.max(165, innerHeight * 0.22));
    const phases = links.map((_, index) => -Math.PI / 2 + (index * Math.PI * 2) / links.length);
    const nodes = links.map((link, index) => {
      const rect = link.getBoundingClientRect();
      return {
        link,
        width: rect.width,
        height: rect.height,
        baseX: link.offsetLeft,
        baseY: link.offsetTop,
        phase: phases[index],
      };
    });

    const animate = (time) => {
      const turn = time * 0.00007;
      nodes.forEach((node) => {
        const x = cx + rx * Math.cos(node.phase + turn) - (node.baseX + node.width / 2);
        const y = cy + ry * Math.sin(node.phase + turn) - (node.baseY + node.height / 2);
        node.link.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      orbitFrame = requestAnimationFrame(animate);
    };

    orbitFrame = requestAnimationFrame(animate);
  };

  let resizeTimer;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (explorer.classList.contains("open")) startOrbit();
    }, 120);
  });

  const openPortfolio = () => {
    explorer.classList.add("open");
    button.setAttribute("aria-expanded", "true");
    document.querySelector(".portfolio")?.setAttribute("aria-hidden", "false");
    startOrbit();
  };

  document.querySelector(".landing-header .wordmark")?.addEventListener("click", (event) => {
    event.preventDefault();
    location.href = "index.html?home=1";
  });

  if (new URLSearchParams(location.search).has("home")) openPortfolio();

  button.addEventListener(
    "click",
    () => {
      openPortfolio();
    },
    { once: true },
  );

  document.querySelectorAll(".orbit-link").forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      stopOrbit();

      const destination = link.href;
      requestAnimationFrame(() => explorer.classList.add("navigating"));
      window.setTimeout(() => {
        location.href = destination;
      }, 520);
    }),
  );
}
