// INTERFACE FOR INFINITE CANVAS
interface infinityProps {
  position: {
    x: number;
    y: number;
  };
  chunks: { [key: string]: HTMLImageElement };
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  configuration: {
    chunkWidth: number;
    chunkHeight: number;
    debugMode: boolean;
  };
  debugMode: boolean;
  updateChunks: () => void;
  moveBy: (dx: number, dy: number, render?: boolean) => void;
  moveTo: (x: number, y: number, render?: boolean) => void;
  refresh: () => void;
  getAllChunks: () => void;
  loadChunk: (chunkId: string | number, chunk: any) => void;
}

/** Creates a infinite canvas board.
 *
 * `ctx` Canvas Context
 *
 * `debug` debug program
 *
 * `chunkWidth` width of each chunk
 *
 * `chunkHeight` height of each chunk
 *
 * !`Warning about small chunks` It has been found that really small chunk sizes have a (very) negative impact on performance.
 */
function infiniteCanvas(
  ctx: CanvasRenderingContext2D,
  debug: boolean = false,
  chunkWidth: number = 500,
  chunkHeight: number = 500
) {
  // local config of canvas sandbox
  var _configuration = {
    chunkWidth: chunkWidth,
    chunkHeight: chunkHeight,
    debugMode: false,
  };

  // create canvas element
  var _offscreenRenderCanvas = document.createElement("canvas");

  // get context created
  var _offscreenRenderCtx = _offscreenRenderCanvas.getContext("2d");

  // assign chunk size to canvas element
  _offscreenRenderCanvas.width = _configuration.chunkWidth;
  _offscreenRenderCanvas.height = _configuration.chunkHeight;

  // get canvas element from context
  var canvas = ctx.canvas;

  /**
   * @returns `key` {x,y} mapped to "x,y" string
   */
  function constructChunkKey(x: number, y: number) {
    return x.toString() + ", " + y.toString();
  }

  /**
   * @returns `key` "x,y" mapped to {x,y}
   */
  function parseChunkKey(key: string) {
    var split = key.split(", ");

    return {
      x: parseInt(split[0]),
      y: parseInt(split[1]),
    };
  }

  /** Takes a position in the world (x,y)
   *
   * `x` axis coordinate
   *
   * `y` axis coordinate
   *
   * `returns` corresponding (x, y) coordinates in the chunk
   */
  function worldCoordinatesToChunkCoordinates(x: number, y: number) {
    return {
      x: Math.floor(x / _configuration.chunkWidth),
      y: Math.floor(y / _configuration.chunkHeight),
    };
  }

  /** Takes a position in the chunk this position lies in (x,y)
   *
   * `x` axis coordinate
   *
   * `y` axis coordinate
   *
   * `returns` corresponding (x, y) coordinates in the world
   */
  function chunkCoordinatesToWorldCoordinates(x: number, y: number) {
    return {
      x: x * _configuration.chunkWidth,
      y: y * _configuration.chunkHeight,
    };
  }

  /** Takes a chunk position (x,y)
   *
   * `x` axis coordinate
   *
   * `y` axis coordinate
   *
   * `returns` corresponding (x, y) coordinates in the viewport
   */
  function chunkCoordinatesToRenderCoordinates(x: number, y: number) {
    return {
      x: x * _configuration.chunkWidth - infinity.position.x,
      y: y * _configuration.chunkHeight - infinity.position.y,
    };
  }

  function getChunk(chunkId: string) {
    // we serialize the coordinate of a chunk with a key, computed from its x and y coordinates
    // say we have a chunk at {x: 1, y: 3}, then our chunks dict looks like
    // {
    //  ...
    //  "1, 3": ..chunkData
    //  ...
    // }
    // if the chunk doesn't exist, create it!
    if (!infinity.chunks[chunkId]) {
      infinity.chunks[chunkId] = new Image(
        _configuration.chunkWidth,
        _configuration.chunkHeight
      );
    }

    // now that we're sure that it exists, return the motherfucker <3
    return infinity.chunks[chunkId];
  }

  function renderChunks(chunks: {}) {
    Object.keys(chunks).forEach(function (key) {
      var coordinates = parseChunkKey(key);
      var renderCoordinate = chunkCoordinatesToRenderCoordinates(
        coordinates.x,
        coordinates.y
      );
      try {
        // drawImage can fail with <img> tags on firefox, this is a confirmed bug.
        // see http://stackoverflow.com/a/18580878 for more details
        ctx.drawImage(
          infinity.chunks[key],
          renderCoordinate.x,
          renderCoordinate.y
        );
      } catch (error) {
        if (error.name === "NS_ERROR_NOT_AVAILABLE") {
          // failed! Doesn't matter much for rendering, it will be re-rendered the next frame
        } else {
          throw error;
        }
      }
    });
  }

  function getChunksInViewport() {
    var chunksInViewport: { [key: string]: HTMLImageElement } = {};

    // we need to figure out what chunks are in the viewport
    // what we need to do is find the coordinates of the chunks in the four corners
    // and then retrieve those chunks, as well as all chunks in between those corners
    var topLeft = worldCoordinatesToChunkCoordinates(
      infinity.position.x,
      infinity.position.y
    );
    var bottomRight = worldCoordinatesToChunkCoordinates(
      infinity.position.x + canvas.width,
      infinity.position.y + canvas.height
    );

    var chunksOnXAxis = Math.abs(topLeft.x - bottomRight.x);
    var chunksOnYAxis = Math.abs(topLeft.y - bottomRight.y);

    // <= instead of < because we definitely need to include the outer layer of chunks as well!
    for (var x = 0; x <= chunksOnXAxis; x++) {
      for (var y = 0; y <= chunksOnYAxis; y++) {
        var chunkKey = constructChunkKey(topLeft.x + x, topLeft.y + y);
        chunksInViewport[chunkKey] = getChunk(chunkKey);
      }
    }

    return chunksInViewport;
  }

  // =====================================
  //             API Methods
  // =====================================
  const updateChunks = function () {
    // a way to speed up this method quite significantly is by preventing
    // updating chunks that did not change.
    // A really simple method would be to pass a bounding box to this function
    // only the chunks inside the bounding box will get updated, this will
    // remove a large part of the redundancy.
    // the bounding box will be generated by the caller
    // for example, draw a box around a path drawn with the mouse, and you have a
    // bounding box around all edited boxes.
    var chunks = getChunksInViewport();

    Object.keys(chunks).forEach(function (key) {
      var coordinates = parseChunkKey(key);
      var renderCoordinates = chunkCoordinatesToRenderCoordinates(
        coordinates.x,
        coordinates.y
      );
      var chunkWorldCoordinates = chunkCoordinatesToWorldCoordinates(
        coordinates.x,
        coordinates.y
      );

      var chunkSourceCoordinates = {
        x: Math.max(renderCoordinates.x, 0),
        y: Math.max(renderCoordinates.y, 0),
      };

      var width =
        Math.min(
          renderCoordinates.x + _configuration.chunkWidth,
          canvas.width
        ) - chunkSourceCoordinates.x;
      var height =
        Math.min(
          renderCoordinates.y + _configuration.chunkHeight,
          canvas.height
        ) - chunkSourceCoordinates.y;

      // don't even bother to update chunks that are not even visible on the canvas! :o
      if (width <= 0 || height <= 0) return;

      var putLocation = {
        x: _configuration.chunkWidth - width,
        y: _configuration.chunkHeight - height,
      };

      if (chunkWorldCoordinates.x >= infinity.position.x) {
        putLocation.x = 0;
      }

      if (chunkWorldCoordinates.y >= infinity.position.y) {
        putLocation.y = 0;
      }

      if (chunks[key].src) {
        _offscreenRenderCtx?.drawImage(chunks[key], 0, 0);
      }

      // ..clear the visible part of the chunk
      _offscreenRenderCtx?.clearRect(
        putLocation.x,
        putLocation.y,
        width,
        height
      );
      // ..render the contents of the main canvas to the offscreen context
      _offscreenRenderCtx?.drawImage(
        canvas,
        chunkSourceCoordinates.x,
        chunkSourceCoordinates.y,
        width,
        height,
        putLocation.x,
        putLocation.y,
        width,
        height
      );
      if (_configuration.debugMode) {
        _offscreenRenderCtx?.strokeRect(
          0,
          0,
          _configuration.chunkWidth,
          _configuration.chunkHeight
        );
        _offscreenRenderCtx?.fillText(key, 15, 15);
      }
      // ..serialize the offscreen context
      infinity.chunks[key].src =
        _offscreenRenderCtx?.canvas.toDataURL() as string;
      // ..finally, clear up the offscreen context so the contents won't be duplicated to other chunks later in this loop
      _offscreenRenderCtx?.clearRect(
        0,
        0,
        _configuration.chunkWidth,
        _configuration.chunkHeight
      );
    });
  };

  const getAllChunks = function () {
    return infinity.chunks;
  };

  const moveTo = function (x: number, y: number, render?: boolean) {
    // default `render` to true, only skip rendering when it's false
    render = render === undefined ? true : render;
    infinity.position.x = x;
    infinity.position.y = y;

    if (render) {
      renderChunks(getChunksInViewport());
    }
  };

  const moveBy = function (dx: number, dy: number, render?: boolean) {
    render = render === undefined ? true : render;
    infinity.position.x += dx;
    infinity.position.y += dy;

    if (render) {
      renderChunks(getChunksInViewport());
    }
  };

  const refresh = function () {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    infinity.moveBy(0, 0);
  };

  // expects a chunk-id, ex "2, 3" and an <img></img> with a src
  const loadChunk = function (chunkId: string | number, chunk: any) {
    infinity.chunks[chunkId] = chunk;
    infinity.refresh();
  };

  var infinity: infinityProps = {
    position: {
      x: 0,
      y: 0,
    },
    // stores ImageData per chunk, used to draw on
    chunks: {} as { [key: string]: HTMLImageElement },
    canvas: canvas,
    ctx: ctx,
    configuration: _configuration,
    debugMode: debug ?? false,
    updateChunks,
    moveBy,
    moveTo,
    refresh,
    getAllChunks,
    loadChunk,
  };

  return infinity;
}

window.infiniteCanvas = {
  initialize: infiniteCanvas,
};

export default infiniteCanvas;
export type { infinityProps };
