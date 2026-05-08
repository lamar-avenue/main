export type DebugFlags = {
  debugFps: boolean;
  highGlow: boolean;
  lowFx: boolean;
  noBlur: boolean;
  noCursorGlow: boolean;
  noSakura: boolean;
};

function hasQueryFlag(params: URLSearchParams, key: string) {
  return params.get(key) === "1";
}

export function getDebugFlags(): DebugFlags {
  if (typeof window === "undefined") {
    return {
      debugFps: false,
      highGlow: false,
      lowFx: false,
      noBlur: false,
      noCursorGlow: false,
      noSakura: false,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const lowFx = hasQueryFlag(params, "lowFx");

  return {
    debugFps: hasQueryFlag(params, "debugFps"),
    highGlow: hasQueryFlag(params, "highGlow"),
    lowFx,
    noBlur: hasQueryFlag(params, "noBlur"),
    noCursorGlow: lowFx || hasQueryFlag(params, "noCursorGlow"),
    noSakura: hasQueryFlag(params, "noSakura"),
  };
}
