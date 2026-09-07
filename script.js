const explorer = document.querySelector("#explorer");
const button = document.querySelector("#explore-button");

if (button && explorer) {
  let orbitFrame;
  let lastSparkle = 0;

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

  const startOrbit = () => {
    if (window.matchMedia("(max-width: 1200px)").matches) return;

    const links = [...document.querySelectorAll(".orbit-link")];
    // Keep the constellation in the open right-hand canvas, but give each
    // card enough room to breathe instead of clustering them together.
    const cx = innerWidth * 0.81;
    const cy = innerHeight * 0.54;
    const rx = Math.min(250, innerWidth * 0.20);
    const ry = Math.min(250, Math.max(200, innerHeight * 0.27));
    const nodes = links.map((link, index) => {
      const rect = link.getBoundingClientRect();
      return {
        link,
        width: rect.width,
        height: rect.height,
        baseX: link.offsetLeft,
        baseY: link.offsetTop,
        phase: -Math.PI / 2 + (index * Math.PI * 2) / links.length,
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

  button.addEventListener(
    "click",
    () => {
      explorer.classList.add("open");
      button.setAttribute("aria-expanded", "true");
      document.querySelector(".portfolio")?.setAttribute("aria-hidden", "false");
      startOrbit();
    },
    { once: true },
  );

  document.querySelectorAll(".orbit-link").forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      cancelAnimationFrame(orbitFrame);

      const destination = link.href;
      requestAnimationFrame(() => explorer.classList.add("navigating"));
      window.setTimeout(() => {
        location.href = destination;
      }, 520);
    }),
  );
}
