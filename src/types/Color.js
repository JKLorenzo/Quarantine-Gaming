export default class Color {
  /**
   * @param {{red: number, green: number, blue: number}} [options] The options of this color
   */
  constructor(options) {
    this.red = options?.red ?? 0;
    this.green = options?.green ?? 0;
    this.blue = options?.blue ?? 0;
  }

  /**
   * Adds the values to this color object.
   * @param {{red: number, green: number, blue: number}} [options] Color options
   */
  add(options) {
    this.red += options?.red ?? 0;
    this.green += options?.green ?? 0;
    this.blue += options?.blue ?? 0;

    // Scale the colors until its acceptable
    while (this.red > 255 || this.green > 255 || this.blue > 255) {
      if (this.red > 0) this.red--;
      if (this.green > 0) this.green--;
      if (this.blue > 0) this.blue--;
    }
  }

  /**
   * Converts this color object to its hex variant.
   * @returns {string}
   */
  toHex() {
    let red = this.red.toString(16);
    let green = this.green.toString(16);
    let blue = this.blue.toString(16);
    if (red.length === 1) red = `0${red}`;
    if (green.length === 1) green = `0${green}`;
    if (blue.length === 1) blue = `0${blue}`;
    return `#${red}${green}${blue}`;
  }
}
