type PerformanceDebugSnapshot = {
  activeElement: string;
  activeIntervals: number;
  activeRafCallbacks: number;
  pointerDown: boolean;
  rafScheduledTotal: number;
  rootClassName: string;
};

type PerformanceDebugApi = {
  log: (eventName: string, details?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    __MARK_QUEST_PERF_DEBUG__?: PerformanceDebugApi;
  }
}

let isInstalled = false;

function formatElement(target: EventTarget | Element | null) {
  if (!(target instanceof Element)) return "unknown";

  const id = target.id ? `#${target.id}` : "";
  const className = typeof target.className === "string" && target.className.trim()
    ? `.${target.className.trim().split(/\s+/).slice(0, 4).join(".")}`
    : "";

  return `${target.tagName.toLowerCase()}${id}${className}`;
}

function getActiveElementLabel() {
  if (typeof document === "undefined") return "none";
  return formatElement(document.activeElement);
}

function getRootClassName() {
  if (typeof document === "undefined") return "";
  return document.querySelector(".appShell")?.className ?? "";
}

function getMediaDetails(target: EventTarget | null) {
  if (!(target instanceof HTMLMediaElement)) return {};

  return {
    className: target.className,
    currentSrc: target.currentSrc,
    muted: target.muted,
    paused: target.paused,
    volume: target.volume,
  };
}

export function installPerformanceDebugProbe(enabled: boolean) {
  if (!enabled || isInstalled || typeof window === "undefined") return;
  isInstalled = true;

  const originalRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const originalCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  const originalSetInterval = window.setInterval.bind(window);
  const originalClearInterval = window.clearInterval.bind(window);

  let activeRafCallbacks = 0;
  let rafScheduledTotal = 0;
  let pointerDown = false;
  const activeIntervals = new Set<number>();
  const rafIds = new Set<number>();

  const snapshot = (): PerformanceDebugSnapshot => ({
    activeElement: getActiveElementLabel(),
    activeIntervals: activeIntervals.size,
    activeRafCallbacks,
    pointerDown,
    rafScheduledTotal,
    rootClassName: getRootClassName(),
  });

  const log: PerformanceDebugApi["log"] = (eventName, details = {}) => {
    console.debug("[mark-quest:perf]", eventName, {
      ...details,
      ...snapshot(),
    });
  };

  window.__MARK_QUEST_PERF_DEBUG__ = { log };

  window.requestAnimationFrame = (callback: FrameRequestCallback) => {
    activeRafCallbacks += 1;
    rafScheduledTotal += 1;

    const id = originalRequestAnimationFrame((timestamp) => {
      if (rafIds.delete(id)) {
        activeRafCallbacks = Math.max(0, activeRafCallbacks - 1);
      }
      callback(timestamp);
    });

    rafIds.add(id);
    return id;
  };

  window.cancelAnimationFrame = (id: number) => {
    if (rafIds.delete(id)) {
      activeRafCallbacks = Math.max(0, activeRafCallbacks - 1);
    }
    originalCancelAnimationFrame(id);
  };

  window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
    const id = originalSetInterval(handler, timeout, ...args);
    activeIntervals.add(id);
    log("interval:start", { id, timeout });
    return id;
  }) as typeof window.setInterval;

  window.clearInterval = (id?: number) => {
    if (typeof id === "number" && activeIntervals.delete(id)) {
      log("interval:clear", { id });
    }
    originalClearInterval(id);
  };

  const logDomEvent = (event: Event) => {
    if (event.type === "pointerdown") pointerDown = true;
    if (event.type === "pointerup" || event.type === "pointercancel") pointerDown = false;

    log(event.type, {
      target: formatElement(event.target),
      type: event.type,
    });
  };

  const domEvents = ["pointerdown", "pointerup", "pointercancel", "click", "focusin", "focusout"];
  domEvents.forEach((eventName) => {
    document.addEventListener(eventName, logDomEvent, true);
  });

  const logWindowFocus = (event: Event) => {
    log(`window:${event.type}`);
  };

  window.addEventListener("focus", logWindowFocus, true);
  window.addEventListener("blur", logWindowFocus, true);

  const logMediaEvent = (event: Event) => {
    log(`media:${event.type}`, {
      target: formatElement(event.target),
      ...getMediaDetails(event.target),
    });
  };

  document.addEventListener("play", logMediaEvent, true);
  document.addEventListener("pause", logMediaEvent, true);
  document.addEventListener("volumechange", logMediaEvent, true);

  const root = document.querySelector(".appShell");
  if (root) {
    let previousClassName = root.className;
    const rootObserver = new MutationObserver(() => {
      const nextClassName = root.className;
      if (nextClassName === previousClassName) return;

      log("root:class-change", {
        from: previousClassName,
        to: nextClassName,
      });
      previousClassName = nextClassName;
    });

    rootObserver.observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  const mouseGlow = document.querySelector(".mouseGlow");
  if (mouseGlow) {
    let previousClassName = mouseGlow.className;
    const mouseGlowObserver = new MutationObserver(() => {
      const nextClassName = mouseGlow.className;
      if (nextClassName === previousClassName) return;

      log("cursorGlow:class-change", {
        from: previousClassName,
        to: nextClassName,
      });
      previousClassName = nextClassName;
    });

    mouseGlowObserver.observe(mouseGlow, { attributes: true, attributeFilter: ["class"] });
  }

  log("probe:installed");
}
