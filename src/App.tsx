import { PointerEvent, WheelEvent, useState } from 'react';
import { Button, IconButton } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ReactCrop, { PixelCrop, Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function App() {
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [crop, setCrop] = useState<Crop>();
  const [scale, setScale] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imgMoving, setImgMoving] = useState(false);
  const [distX, setDistX] = useState(0);
  const [distY, setDistY] = useState(0);
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    setScale(scale - event.deltaY / 25);
    event.stopPropagation();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.ctrlKey) {
      setImgMoving(true);
      setDistX(offsetX - event.clientX);
      setDistY(offsetY - event.clientY);
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handlePointerUp = () => {
    setImgMoving(false);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) {
      setImgMoving(false);
    } else if (imgMoving) {
      setOffsetX(distX + event.clientX);
      setOffsetY(distY + event.clientY);
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const onVideoLoad = () => {
    const video = document.querySelector('video');
    if (video === null) return;
    const canvas = document.querySelector('canvas');
    if (canvas === null) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context === null) return;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const img = document.getElementById('image') as HTMLImageElement;
    const canvasdiv = document.getElementById('canvasdiv');
    if (canvasdiv === null) return;
    const style = window.getComputedStyle(canvasdiv);
    const divwidth = Number(style.width.replace('px', ''));
    const divheight = Number(style.height.replace('px', ''));
    setOffsetX((divwidth - video.videoWidth) / 2);
    setOffsetY((divheight - video.videoHeight) / 2);
    img.style.width = `${video.videoWidth}px`;
    img.style.height = `${video.videoHeight}px`;
    img.src = canvas.toDataURL();
    img.style.display = 'block';
    setScale(100);
    const stream = video.srcObject as MediaStream;
    const tracks = stream.getTracks() as [MediaStreamTrack];
    tracks.forEach((track) => {
      track.stop();
    });
    video.srcObject = null;
    setCrop({
      x: 5,
      y: 5,
      width: 90,
      height: 90,
      unit: '%',
    });
  };

  const handleScale = (event: Event, value: number) => {
    setScale(value);
  };

  function handleSuccess(stream: MediaProvider | null) {
    setCrop(undefined);
    const video = document.querySelector('video') as HTMLVideoElement;
    video.srcObject = stream;
    video.play();
  }

  const handleError = (error: string) => {
    // eslint-disable-next-line
    console.log('navigator.getDisplayMedia error: ', error);
  };

  const clickCapture = () => {
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then(handleSuccess)
      .catch(handleError);
  };

  const clickDownload = () => {
    if (!completedCrop || completedCrop.width === 0) {
      return;
    }

    const image = document.getElementById('image') as HTMLImageElement;
    const canvas = document.querySelector('canvas');
    if (canvas === null) return;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = 1;
    canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;
    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.translate(centerX, centerY);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale / 100, scale / 100);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight
    );
    ctx.restore();

    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'download.png';
    a.click();
  };

  return (
    <div className="mx-auto mt-4 text-center max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg">
      <video muted onLoadedMetadata={onVideoLoad} style={{ display: 'none' }} />
      <canvas style={{ display: 'none' }} />
      <div
        id="canvasdiv"
        className="rounded outline outline-1 outline-gray-400 w-full h-64 sm:h-72 md:h-80 lg:h-96 mb-2"
        onWheel={(e) => handleWheel(e)}
        onPointerMove={(e) => handlePointerMove(e)}
        onPointerDown={(e) => handlePointerDown(e)}
        onPointerUp={handlePointerUp}
      >
        <Stack sx={{ height: '100%' }} spacing={0} direction="row">
          <ReactCrop
            crop={crop}
            keepSelection
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              maxHeight: '100%',
              overflow: 'hidden',
            }}
          >
            <img
              id="image"
              alt="Crop me"
              style={{
                transform: `scale(${scale / 100})`,
                left: `${offsetX}px`,
                top: `${offsetY}px`,
                display: 'none',
                position: 'relative',
                maxWidth: 'none',
                maxHeight: 'none',
                border: 0,
              }}
            />
          </ReactCrop>
          <Stack>
            <Slider
              orientation="vertical"
              size="small"
              aria-label="Scale"
              valueLabelDisplay="auto"
              value={scale}
              onChange={(event, value) => {
                handleScale(event, value as number);
              }}
              max={200}
              sx={{ height: '100%' }}
              valueLabelFormat={(x) => `${x}%`}
              className="mt-1 mb-4"
            />
            <Tooltip title="Left" placement="right">
              <IconButton
                aria-label="left"
                size="small"
                onClick={() => setOffsetX(offsetX - 10)}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Right" placement="right">
              <IconButton
                aria-label="right"
                size="small"
                onClick={() => setOffsetX(offsetX + 10)}
              >
                <ArrowForwardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Up" placement="right">
              <IconButton
                aria-label="up"
                size="small"
                onClick={() => setOffsetY(offsetY - 10)}
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Down" placement="right">
              <IconButton
                aria-label="down"
                size="small"
                onClick={() => setOffsetY(offsetY + 10)}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </div>
      <div>
        <Button
          className="w-32"
          sx={{ margin: 1 }}
          variant="contained"
          onClick={clickCapture}
        >
          Capture
        </Button>
      </div>
      <div>
        <Button
          className="w-32"
          sx={{ margin: 1 }}
          variant="contained"
          onClick={clickDownload}
        >
          Download
        </Button>
      </div>
    </div>
  );
}

export default App;
