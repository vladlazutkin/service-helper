export interface Range {
  id: string;
  start: number;
  stop: number;
}
export interface Dimensions {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface RangeMap {
  range: Range;
  dimensions: Dimensions;
}
