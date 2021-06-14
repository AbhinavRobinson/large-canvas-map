import { initializeWorld as infiniteCanvas } from "./canvasPlugin";

const render = () => {
  var canvas = document.createElement("canvas");
  var ctx: CanvasRenderingContext2D = canvas.getContext(
    "2d"
  ) as CanvasRenderingContext2D;
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var inf_ctx = infiniteCanvas(ctx);
  var mouseIsDown = false;
  var middleOrRightIsDown = false;
  var previousMousePosition: { x: any; y: any };
  canvas.addEventListener("mousedown", function (event) {
    if (event.button === 0) {
      mouseIsDown = true;
    } else {
      middleOrRightIsDown = true;
    }
  });
  window.addEventListener("mouseup", function (event) {
    if (event.button === 0) {
      mouseIsDown = false;
      if (inf_ctx.updateChunks) {
        inf_ctx.updateChunks();
      }
    } else {
      middleOrRightIsDown = false;
    }
  });

  window.addEventListener("mousemove", function (event) {
    var newMousePosition = { x: event.offsetX, y: event.offsetY };
    if (mouseIsDown) {
      if (previousMousePosition) {
        ctx.beginPath();
        ctx.moveTo(previousMousePosition.x, previousMousePosition.y);
        ctx.lineTo(newMousePosition.x, newMousePosition.y);
        ctx.stroke();
      }
    } else if (middleOrRightIsDown) {
      var dx = previousMousePosition.x - newMousePosition.x;
      var dy = previousMousePosition.y - newMousePosition.y;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (inf_ctx.moveBy) {
        inf_ctx.moveBy(dx, dy);
      }
    }
    previousMousePosition = newMousePosition;
  });
};

export default render;
