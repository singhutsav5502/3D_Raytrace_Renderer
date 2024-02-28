class Color {
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  _addColorComponent(color) {
    return new Color(
      this.r + color.r,
      this.g + color.g,
      this.b + color.b,
    )
  }
  multiply(color) {
    return new Color(
      this.r * color.r,
      this.g * color.g,
      this.b * color.b,

    )
  }
  scale(factor) {
    return new Color(
      this.r * factor,
      this.g * factor,
      this.b * factor,
    )
  }
  plus(other){
    return new Color(
      this.r + other.r,
      this.g + other.g,
      this.b + other.b,
    )
  }
  static clampColors(color) {
    return new Color(
      Math.min(Math.max(color.r, 0), 1),
      Math.min(Math.max(color.g, 0), 1),
      Math.min(Math.max(color.b, 0), 1),
    )
  }
  static mix(start, end, factor) {
    return start.scale(1 - factor).plus(end.scale(factor));
  }
}