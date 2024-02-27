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
}