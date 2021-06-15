import infiniteCanvas from "./canvasPlugin";

import * as images from "../assets/index";

const render = () => {
  var canvas = document.createElement("canvas");

  var ctx: CanvasRenderingContext2D = canvas.getContext(
    "2d"
  ) as CanvasRenderingContext2D;

  document.body.appendChild(canvas);

  canvas.width = window.innerWidth - 20;
  canvas.height = window.innerHeight - 20;

  var size = 1000;
  var debug = true;

  var inf_ctx = infiniteCanvas(ctx, debug, size, size);
  var row = 0;
  var col = 0;
  inf_ctx.updateChunks();
  inf_ctx.refresh();

  imageData.map((item) => {
    var base_image = new Image();
    base_image.onload = () => {
      base_image.style.position = "fixed";
      base_image.style.objectFit = "fit";
      base_image.style.maxWidth = size + "px";
      base_image.style.maxHeight = size + "px";
      inf_ctx.loadChunk(id, base_image);
      inf_ctx.refresh();
    };
    base_image.src = item;
    var id = row + ", " + col;
    row++;
    if (row > 3) {
      row = 0;
      col++;
    }
    return true;
  });

  // var mouseIsDown = false;
  var middleOrRightIsDown = false;
  var previousMousePosition: { x: number; y: number };

  canvas.addEventListener("mousedown", function (event) {
    if (event.button === 0) {
      // mouseIsDown = true;
    } else {
      middleOrRightIsDown = true;
    }
  });

  window.addEventListener("mouseup", function (event) {
    if (event.button === 0) {
      // mouseIsDown = false;
      if (inf_ctx.updateChunks) {
        inf_ctx.updateChunks();
      }
    } else {
      middleOrRightIsDown = false;
    }
  });

  window.addEventListener("mousemove", function (event) {
    var newMousePosition = { x: event.offsetX, y: event.offsetY };
    // if (mouseIsDown) {
    //   if (previousMousePosition) {
    //     ctx.beginPath();
    //     ctx.moveTo(previousMousePosition.x, previousMousePosition.y);
    //     ctx.lineTo(newMousePosition.x, newMousePosition.y);
    //     ctx.stroke();
    //   }
    // } else
    if (middleOrRightIsDown) {
      var dx = previousMousePosition.x - newMousePosition.x;
      var dy = previousMousePosition.y - newMousePosition.y;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (inf_ctx.moveBy) {
        inf_ctx.moveBy(dx, dy);
      }
    }
    previousMousePosition = newMousePosition;
  });

  window.addEventListener("wheel", function (event) {
    var wheel = event.deltaY / 200; //n or -n

    var zoom = 1 + -wheel / 2;
    ctx.scale(zoom, zoom);
    inf_ctx.refresh();
  });
};

export default render;

const imageData = [
  images.image_1,
  images.image_2,
  images.image_3,
  images.image_4,
  images.image_5,
  images.image_6,
  images.image_7,
  images.image_8,
  images.image_9,
  images.image_10,
  images.image_11,
  images.image_12,
  images.image_13,
  images.image_14,
  images.image_15,
];
