import "./styles.css";
import React, { useEffect, useRef, useState } from "react";
import { SketchPicker } from "react-color";

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h, s, l];
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}

function colorToString(color) {
  if (!color) {
    return "gray";
  }
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
}

class ColorPicker extends React.Component {
  state = {
    displayColorPicker: false,
    color: {
      r: "241",
      g: "112",
      b: "19",
      a: "1"
    }
  };

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false });
  };

  render() {
    const styles = {
      outer: {
        position: "relative",
        display: "inline-block"
      },
      color: {
        width: "36px",
        height: "14px",
        borderRadius: "2px",
        background: `rgb(${this.props.color[0]}, ${this.props.color[1]}, ${this.props.color[2]})`
      },
      swatch: {
        padding: "5px",
        background: "#fff",
        borderRadius: "1px",
        boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
        display: "inline-block",
        cursor: "pointer"
      },
      popover: {
        position: "absolute",
        zIndex: "2"
      },
      cover: {
        position: "fixed",
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px"
      }
    };

    return (
      <div style={styles.outer}>
        <div style={styles.swatch} onClick={this.handleClick}>
          <div style={styles.color} />
        </div>
        {this.state.displayColorPicker ? (
          <div style={styles.popover}>
            <div style={styles.cover} onClick={this.handleClose} />
            <SketchPicker
              color={{
                r: this.props.color[0],
                g: this.props.color[1],
                b: this.props.color[2]
              }}
              onChange={(color) => {
                this.props.onChange([color.rgb.r, color.rgb.g, color.rgb.b]);
              }}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

export default function App() {
  const canvasInputRef = useRef(null);
  const canvasOutputRef = useRef(null);
  const [hoveredColor, setHoveredColor] = useState([255, 255, 255]);
  const [selectedColor, setSelectedColor] = useState([255, 255, 255]);
  const [targetColor, setTargetColor] = useState([168, 6, 64]);

  useEffect(() => {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "./cog.png";
    var canvas = canvasInputRef.current;
    var ctx = canvas.getContext("2d");
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      img.style.display = "none";
    };
  }, []);

  useEffect(() => {
    drawOutput(selectedColor, targetColor);
  }, [selectedColor, targetColor]);

  function getColorAtCursor(event) {
    var canvasInput = canvasInputRef.current;
    var ctx = canvasInput.getContext("2d");
    var x = event.nativeEvent.layerX;
    var y = event.nativeEvent.layerY;
    var pixel = ctx.getImageData(x, y, 1, 1);
    var data = pixel.data;
    return [data[0], data[1], data[2]];
  }

  function drawOutput(selectedColor, targetColor) {
    var canvasInput = canvasInputRef.current;
    var ctxInput = canvasInput.getContext("2d");
    var canvasOutput = canvasOutputRef.current;
    var ctxOutput = canvasOutput.getContext("2d");

    var hslStart = rgbToHsl(
      selectedColor[0],
      selectedColor[1],
      selectedColor[2]
    );
    var hslEnd = rgbToHsl(targetColor[0], targetColor[1], targetColor[2]);
    var hslCorrection = [
      hslEnd[0] - hslStart[0],
      hslEnd[1] - hslStart[1],
      hslEnd[2] - hslStart[2]
    ];

    const imageData = ctxInput.getImageData(
      0,
      0,
      canvasInput.width,
      canvasInput.height
    );
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      // If full black or full white, probably background, leaving as is
      const sum = data[i] + data[i + 1] + data[i + 2];
      if (sum < 20 || sum > 256 * 3 - 20) {
        continue;
      }

      var hsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
      var rgb = hslToRgb(
        hsl[0] + hslCorrection[0],
        hsl[1] + hslCorrection[1],
        hsl[2] + hslCorrection[2]
      );
      data[i] = rgb[0]; // red
      data[i + 1] = rgb[1]; // green
      data[i + 2] = rgb[2]; // blue
    }
    ctxOutput.putImageData(imageData, 0, 0);
  }

  return (
    <div className="App">
      <h1>Recolor and image</h1>
      <p>
        This small tool lets you recolor an image to a specific color you want.
      </p>
      <p>
        Target Color:
        <ColorPicker
          color={targetColor}
          onChange={(color) => setTargetColor(color)}
        />
        Selected Color:
        <ColorPicker
          color={selectedColor}
          onChange={(color) => setSelectedColor(color)}
        />
      </p>
      <canvas
        width={538}
        height={536}
        ref={canvasInputRef}
        onMouseMove={(event) => setHoveredColor(getColorAtCursor(event))}
        onClick={(event) => {
          const color = getColorAtCursor(event);
          setSelectedColor(color);
        }}
      />
      <canvas
        width={538}
        height={536}
        ref={canvasOutputRef}
        onMouseMove={(event) => setHoveredColor(getColorAtCursor(event))}
        onClick={(event) => setSelectedColor(getColorAtCursor(event))}
      />
    </div>
  );
}
