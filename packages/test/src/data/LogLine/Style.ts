import type { Fragment } from "./Fragment.js";
export const enum StyleTag {
  Primary = "Primary",
  Default = "Default",
  Warning = "Warning",
  Error = "Error",
  Info = "Info",
  Detail = "Detail",
  Dimmed = "Dimmed",
  Bold = "Bold",
  Underlined = "Underlined",
  Ansi = "Ansi",
}

export interface Primary {
  readonly _tag: StyleTag.Primary;
}

/**
 * @tsplus static fncts.test.data.StyleOps Primary
 */
export const Primary: Style = {
  _tag: StyleTag.Primary,
};

export interface Default {
  readonly _tag: StyleTag.Default;
}

/**
 * @tsplus static fncts.test.data.StyleOps Default
 */
export const Default: Style = {
  _tag: StyleTag.Default,
};

export interface Warning {
  readonly _tag: StyleTag.Warning;
}

/**
 * @tsplus static fncts.test.data.StyleOps Warning
 */
export const Warning: Style = {
  _tag: StyleTag.Warning,
};

export interface Error {
  readonly _tag: StyleTag.Error;
}

/**
 * @tsplus static fncts.test.data.StyleOps Error
 */
export const Error: Style = {
  _tag: StyleTag.Error,
};

export interface Info {
  readonly _tag: StyleTag.Info;
}

/**
 * @tsplus static fncts.test.data.StyleOps Info
 */
export const Info: Style = {
  _tag: StyleTag.Info,
};

export interface Detail {
  readonly _tag: StyleTag.Detail;
}

/**
 * @tsplus static fncts.test.data.StyleOps Detail
 */
export const Detail: Style = {
  _tag: StyleTag.Detail,
};

export interface Dimmed {
  readonly _tag: StyleTag.Dimmed;
}

/**
 * @tsplus static fncts.test.data.StyleOps Dimmed
 */
export const Dimmed: Style = {
  _tag: StyleTag.Dimmed,
};

export interface Bold {
  readonly _tag: StyleTag.Bold;
  readonly fr: Fragment;
}

/**
 * @tsplus static fncts.test.data.StyleOps Bold
 */
export function Bold(fr: Fragment): Style {
  return {
    _tag: StyleTag.Bold,
    fr,
  };
}

export interface Underlined {
  readonly _tag: StyleTag.Underlined;
  readonly fr: Fragment;
}

/**
 * @tsplus static fncts.test.data.StyleOps Underlined
 */
export function Underlined(fr: Fragment): Style {
  return {
    _tag: StyleTag.Underlined,
    fr,
  };
}

export interface Ansi {
  readonly _tag: StyleTag.Ansi;
  readonly fr: Fragment;
  readonly ansiColor: string;
}

/**
 * @tsplus static fncts.test.data.StyleOps Ansi
 */
export function Ansi(fr: Fragment, ansiColor: string): Style {
  return {
    _tag: StyleTag.Ansi,
    fr,
    ansiColor,
  };
}

/**
 * @tsplus type fncts.test.data.StyleOps
 */
export type Style = Primary | Default | Warning | Error | Info | Detail | Dimmed | Bold | Underlined | Ansi;

/**
 * @tsplus type fncts.test.data.StyleOps
 */
export interface StyleOps {}

export const Style: StyleOps = {};
