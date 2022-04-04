import { Fragment } from "./Fragment.js";
import { Style } from "./Style.js";

export function info(s: string): Fragment {
  return new Fragment(s, Style.Info);
}

export function error(s: string): Fragment {
  return new Fragment(s, Style.Error);
}

export function warn(s: string): Fragment {
  return new Fragment(s, Style.Warning);
}

export function primary(s: string): Fragment {
  return new Fragment(s, Style.Primary);
}

export function detail(s: string): Fragment {
  return new Fragment(s, Style.Detail);
}

export function fr(s: string): Fragment {
  return new Fragment(s, Style.Default);
}

export function dim(s: string): Fragment {
  return new Fragment(s, Style.Dimmed);
}

export function bold(s: string): Fragment {
  return fr(s).bold;
}

export function underlined(s: string): Fragment {
  return fr(s).underlined;
}

export const sp = new Fragment(" ");
