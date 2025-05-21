
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Bold,
  RotateCw,
  RotateCcw,
  Crop,
  ZoomIn,
  ZoomOut,
  Circle,
  ArrowLeft,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  RefreshCw,
  FlipHorizontal,
  FlipVertical,
  Move,
  Instagram,
} from "lucide-react";

interface ImageEditorProps {
  imageUrl: string;
  onBackToUpload: () => void;
}

// Gradient preset options for border
const gradientPresets = [
  { name: "Purple to Blue", value: "linear-gradient(to right, #9b87f5, #1EAEDB)" },
  { name: "Sunset", value: "linear-gradient(to right, #ee9ca7, #ffdde1)" },
  { name: "Nature", value: "linear-gradient(90deg, hsla(139, 70%, 75%, 1) 0%, hsla(63, 90%, 76%, 1) 100%)" },
  { name: "Fire", value: "linear-gradient(90deg, hsla(29, 92%, 70%, 1) 0%, hsla(0, 87%, 73%, 1) 100%)" },
  { name: "Ocean", value: "linear-gradient(90deg, hsla(186, 33%, 94%, 1) 0%, hsla(216, 41%, 79%, 1) 100%)" },
  { name: "Rainbow", value: "linear-gradient(90deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8)" },
  { name: "Midnight", value: "linear-gradient(90deg, hsla(221, 45%, 73%, 1) 0%, hsla(220, 78%, 29%, 1) 100%)" },
  { name: "Rose Gold", value: "linear-gradient(90deg, hsla(24, 100%, 83%, 1) 0%, hsla(341, 91%, 68%, 1) 100%)" },
  { name: "Solid", value: "" },
];

// Aspect ratio options for crop
const aspectRatioOptions = [
  { name: "Free", value: null },
  { name: "1:1", value: 1 },
  { name: "4:3", value: 4/3 },
  { name: "16:9", value: 16/9 },
  { name: "3:4", value: 3/4 },
  { name: "9:16", value: 9/16 },
];

export function ImageEditor({ imageUrl, onBackToUpload }: ImageEditorProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Editor state
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isCircular, setIsCircular] = useState(false);
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#8b5cf6"); // Purple
  const [borderGradient, setBorderGradient] = useState("");
  const [horizontalFlip, setHorizontalFlip] = useState(false);
  const [verticalFlip, setVerticalFlip] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isMovingImage, setIsMovingImage] = useState(false);
  const [moveStart, setMoveStart] = useState({ x: 0, y: 0 });

  // Crop state
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [originalImageData, setOriginalImageData] = useState<HTMLImageElement | null>(null);
  const [cropRectVisible, setCropRectVisible] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(null);
  const [cropMode, setCropMode] = useState<"draw" | "move" | "resize-tl" | "resize-tr" | "resize-bl" | "resize-br" | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState("none");

  // Initialize canvas and load image
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    if (!context) return;
    
    setCtx(context);
    
    const image = new Image();
    image.src = imageUrl;
    imageRef.current = image;
    
    image.onload = () => {
      // Store original image for cropping reset
      setOriginalImageData(image);
      
      // Set canvas size based on image dimensions
      canvas.width = image.width;
      canvas.height = image.height;
      
      // Draw the image
      renderCanvas();
    };
  }, [imageUrl]);

  // Re-render canvas when editing params change
  useEffect(() => {
    renderCanvas();
  }, [rotation, scale, isCircular, borderWidth, borderColor, borderGradient, activeFilter, horizontalFlip, verticalFlip, imagePosition]);

  // Filter functions
  const applyGrayscale = (imageData: ImageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
  };

  const applySepia = (imageData: ImageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    }
  };

  const applyInvert = (imageData: ImageData) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  };

  const applyBrightness = (imageData: ImageData, factor: number) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * factor);
      data[i + 1] = Math.min(255, data[i + 1] * factor);
      data[i + 2] = Math.min(255, data[i + 2] * factor);
    }
  };

  const applyContrast = (imageData: ImageData, factor: number) => {
    const data = imageData.data;
    const factor1 = (259 * (factor + 255)) / (255 * (259 - factor));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor1 * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor1 * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor1 * (data[i + 2] - 128) + 128));
    }
  };

  const renderCanvas = () => {
    if (!canvasRef.current || !ctx || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context
    ctx.save();
    
    // Move to center, rotate, scale, then move back
    ctx.translate(canvas.width / 2 + imagePosition.x, canvas.height / 2 + imagePosition.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(horizontalFlip ? -scale : scale, verticalFlip ? -scale : scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Apply circular mask if needed
    if (isCircular) {
      ctx.beginPath();
      const radius = Math.min(canvas.width, canvas.height) / 2;
      ctx.arc(canvas.width / 2, canvas.height / 2, radius - borderWidth, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }
    
    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Restore context for border
    ctx.restore();
    
    // Draw border if needed
    if (borderWidth > 0) {
      ctx.save();
      
      if (borderGradient) {
        // Create gradient border
        try {
          const grad = createGradient(ctx, borderGradient, canvas.width, canvas.height);
          ctx.strokeStyle = grad;
        } catch (e) {
          ctx.strokeStyle = borderColor;
        }
      } else {
        ctx.strokeStyle = borderColor;
      }
      
      ctx.lineWidth = borderWidth;
      
      if (isCircular) {
        ctx.beginPath();
        const radius = Math.min(canvas.width, canvas.height) / 2;
        ctx.arc(
          canvas.width / 2 + imagePosition.x, 
          canvas.height / 2 + imagePosition.y, 
          radius - borderWidth / 2, 
          0, 
          Math.PI * 2
        );
        ctx.closePath();
        ctx.stroke();
      } else {
        const offset = borderWidth / 2;
        ctx.strokeRect(
          offset + imagePosition.x, 
          offset + imagePosition.y, 
          canvas.width - borderWidth, 
          canvas.height - borderWidth
        );
      }
      
      ctx.restore();
    }
    
    // Draw crop overlay if needed
    if (isCropping && cropRectVisible) {
      ctx.save();
      
      // Darken the whole canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate crop rectangle
      const x = Math.min(cropStart.x, cropEnd.x);
      const y = Math.min(cropStart.y, cropEnd.y);
      const width = Math.abs(cropEnd.x - cropStart.x);
      const height = Math.abs(cropEnd.y - cropStart.y);
      
      // Clear the crop area
      ctx.clearRect(x, y, width, height);
      
      // Draw border around crop area
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw handles at corners
      const handleSize = 10;
      const handles = [
        { x, y, cursor: "nwse-resize", type: "resize-tl" },  // top-left
        { x: x + width, y, cursor: "nesw-resize", type: "resize-tr" },  // top-right
        { x, y: y + height, cursor: "nesw-resize", type: "resize-bl" },  // bottom-left
        { x: x + width, y: y + height, cursor: "nwse-resize", type: "resize-br" }  // bottom-right
      ];
      
      handles.forEach(handle => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
      });
      
      // Draw guide lines
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      // Vertical center
      ctx.moveTo(x + width / 2, y);
      ctx.lineTo(x + width / 2, y + height);
      // Horizontal center
      ctx.moveTo(x, y + height / 2);
      ctx.lineTo(x + width, y + height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.restore();
    }
    
    // Apply filters
    if (activeFilter !== "none" && activeFilter) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      switch (activeFilter) {
        case "grayscale":
          applyGrayscale(imageData);
          break;
        case "sepia":
          applySepia(imageData);
          break;
        case "invert":
          applyInvert(imageData);
          break;
        case "brightness":
          applyBrightness(imageData, 1.2);
          break;
        case "contrast":
          applyContrast(imageData, 1.5);
          break;
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
  };

  // Helper function to create gradients on canvas
  const createGradient = (ctx: CanvasRenderingContext2D, gradientStr: string, width: number, height: number) => {
    if (gradientStr.includes("linear-gradient")) {
      // Extract direction and colors from linear-gradient
      const match = gradientStr.match(/linear-gradient\(([^,]+),\s*([^)]+)\)/);
      if (!match) return ctx.createLinearGradient(0, 0, width, 0);
      
      const direction = match[1].trim();
      const colorsStr = match[2].trim();
      const colors = colorsStr.split(",").map(c => c.trim());
      
      let gradient;
      
      if (direction.includes("right")) {
        gradient = ctx.createLinearGradient(0, 0, width, 0);
      } else if (direction.includes("bottom")) {
        gradient = ctx.createLinearGradient(0, 0, 0, height);
      } else if (direction.includes("deg")) {
        const deg = parseInt(direction);
        const angle = (deg * Math.PI) / 180;
        const x1 = width / 2 - Math.cos(angle) * width / 2;
        const y1 = height / 2 - Math.sin(angle) * height / 2;
        const x2 = width / 2 + Math.cos(angle) * width / 2;
        const y2 = height / 2 + Math.sin(angle) * height / 2;
        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      } else {
        gradient = ctx.createLinearGradient(0, 0, width, 0);
      }
      
      // Add color stops
      if (colors.length === 2) {
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
      } else {
        colors.forEach((color, index) => {
          gradient.addColorStop(index / (colors.length - 1), color);
        });
      }
      
      return gradient;
    }
    
    // Default gradient if parsing fails
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#9b87f5");
    gradient.addColorStop(1, "#1EAEDB");
    return gradient;
  };

  // Canvas event handlers for operations
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    if (isCropping) {
      // Check if clicking on a resize handle
      if (cropRectVisible) {
        const cropX = Math.min(cropStart.x, cropEnd.x);
        const cropY = Math.min(cropStart.y, cropEnd.y);
        const cropWidth = Math.abs(cropEnd.x - cropStart.x);
        const cropHeight = Math.abs(cropEnd.y - cropStart.y);
        const handleSize = 15; // Larger clickable area
        
        // Check each handle
        const tl = { x: cropX, y: cropY };
        const tr = { x: cropX + cropWidth, y: cropY };
        const bl = { x: cropX, y: cropY + cropHeight };
        const br = { x: cropX + cropWidth, y: cropY + cropHeight };
        
        if (Math.abs(x - tl.x) < handleSize && Math.abs(y - tl.y) < handleSize) {
          setCropMode("resize-tl");
          setIsDragging(true);
          return;
        }
        
        if (Math.abs(x - tr.x) < handleSize && Math.abs(y - tr.y) < handleSize) {
          setCropMode("resize-tr");
          setIsDragging(true);
          return;
        }
        
        if (Math.abs(x - bl.x) < handleSize && Math.abs(y - bl.y) < handleSize) {
          setCropMode("resize-bl");
          setIsDragging(true);
          return;
        }
        
        if (Math.abs(x - br.x) < handleSize && Math.abs(y - br.y) < handleSize) {
          setCropMode("resize-br");
          setIsDragging(true);
          return;
        }
        
        // Check if inside crop box (for moving)
        if (x >= cropX && x <= cropX + cropWidth &&
            y >= cropY && y <= cropY + cropHeight) {
          setCropMode("move");
          setMoveStart({ x, y });
          setIsDragging(true);
          return;
        }
      }
      
      // Start a new crop
      setCropStart({ x, y });
      setCropEnd({ x, y });
      setCropMode("draw");
      setIsDragging(true);
      setCropRectVisible(true);
      return;
    }
    
    // Handle image moving
    setIsMovingImage(true);
    setMoveStart({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDragging) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    if (isCropping) {
      if (cropMode === "draw") {
        // When drawing a new crop region
        let newX = x;
        let newY = y;
        
        // Apply aspect ratio if selected
        if (selectedAspectRatio) {
          const width = Math.abs(x - cropStart.x);
          const height = width / selectedAspectRatio;
          
          // Determine direction to maintain the aspect ratio
          if (x > cropStart.x) {
            // Drawing to the right
            if (y > cropStart.y) {
              // Drawing downwards
              newY = cropStart.y + height;
            } else {
              // Drawing upwards
              newY = cropStart.y - height;
            }
          } else {
            // Drawing to the left
            if (y > cropStart.y) {
              // Drawing downwards
              newY = cropStart.y + height;
            } else {
              // Drawing upwards
              newY = cropStart.y - height;
            }
          }
        }
        
        setCropEnd({ x: newX, y: newY });
      } else if (cropMode === "move") {
        // Moving entire crop box
        const deltaX = x - moveStart.x;
        const deltaY = y - moveStart.y;
        
        setCropStart(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        setCropEnd(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        setMoveStart({ x, y });
      } else if (cropMode?.startsWith("resize")) {
        // Resizing crop box
        const cropX = Math.min(cropStart.x, cropEnd.x);
        const cropY = Math.min(cropStart.y, cropEnd.y);
        const cropWidth = Math.abs(cropEnd.x - cropStart.x);
        const cropHeight = Math.abs(cropEnd.y - cropStart.y);
        
        if (cropMode === "resize-tl") {
          // Top-left: Moving cropStart
          let newX = x;
          let newY = y;
          
          if (selectedAspectRatio) {
            const width = cropX + cropWidth - x;
            const height = width / selectedAspectRatio;
            newY = cropY + cropHeight - height;
          }
          
          setCropStart({ x: newX, y: newY });
        } else if (cropMode === "resize-tr") {
          // Top-right: Moving cropEnd.x and cropStart.y
          let newY = y;
          
          if (selectedAspectRatio) {
            const width = x - cropX;
            const height = width / selectedAspectRatio;
            newY = cropY + cropHeight - height;
          }
          
          setCropEnd(prev => ({ x, y: prev.y }));
          setCropStart(prev => ({ x: prev.x, y: newY }));
        } else if (cropMode === "resize-bl") {
          // Bottom-left: Moving cropStart.x and cropEnd.y
          let newX = x;
          
          if (selectedAspectRatio) {
            const width = cropX + cropWidth - x;
            const height = width / selectedAspectRatio;
            setCropEnd(prev => ({ x: prev.x, y: cropY + height }));
          } else {
            setCropEnd(prev => ({ x: prev.x, y }));
          }
          
          setCropStart(prev => ({ x: newX, y: prev.y }));
        } else if (cropMode === "resize-br") {
          // Bottom-right: Moving cropEnd
          let newX = x;
          let newY = y;
          
          if (selectedAspectRatio) {
            const width = x - cropX;
            const height = width / selectedAspectRatio;
            newY = cropY + height;
          }
          
          setCropEnd({ x: newX, y: newY });
        }
      }
      
      renderCanvas();
      return;
    }
    
    if (isMovingImage) {
      // Handle image moving
      const deltaX = e.clientX - moveStart.x;
      const deltaY = e.clientY - moveStart.y;
      
      setMoveStart({ x: e.clientX, y: e.clientY });
      setImagePosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setCropMode(null);
    setIsMovingImage(false);
    renderCanvas();
  };

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleZoom = (direction: "in" | "out") => {
    setScale((prev) => {
      const newScale = direction === "in" ? prev * 1.1 : prev / 1.1;
      return Math.max(0.1, Math.min(3, newScale)); // Limit scale between 0.1 and 3
    });
  };

  const handleCircleToggle = () => {
    setIsCircular((prev) => !prev);
  };

  const handleFlip = (direction: "horizontal" | "vertical") => {
    if (direction === "horizontal") {
      setHorizontalFlip((prev) => !prev);
    } else {
      setVerticalFlip((prev) => !prev);
    }
  };

  const handleCropToggle = () => {
    if (isCropping) {
      // Apply crop
      applyCrop();
    } else {
      // Start cropping
      setIsCropping(true);
      setCropRectVisible(false);
      
      // Initialize crop area to full canvas
      if (canvasRef.current) {
        setCropStart({ x: 0, y: 0 });
        setCropEnd({ x: canvasRef.current.width, y: canvasRef.current.height });
      }
      
      toast({
        title: "Crop mode activated",
        description: "Click and drag on the image to select an area to crop.",
      });
    }
  };

  const applyCrop = () => {
    if (!canvasRef.current || !ctx || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    
    // Calculate crop rectangle
    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);
    
    // Skip if crop area is too small
    if (width < 10 || height < 10) {
      setIsCropping(false);
      setCropRectVisible(false);
      renderCanvas();
      
      toast({
        title: "Crop canceled",
        description: "The selected area was too small to crop.",
      });
      return;
    }
    
    // Create a temporary canvas for the cropped area
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    
    if (!tempCtx) return;
    
    // Draw only the cropped portion
    tempCtx.drawImage(
      canvas,
      x, y, width, height,  // Source coordinates
      0, 0, width, height   // Destination coordinates
    );
    
    // Generate preview
    setCroppedPreview(tempCanvas.toDataURL());
    
    // Resize the main canvas
    canvas.width = width;
    canvas.height = height;
    
    // Draw the cropped image back to the main canvas
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Create a new image from the cropped canvas
    const newImage = new Image();
    newImage.src = canvas.toDataURL();
    
    // Wait for the new image to load before setting it
    newImage.onload = () => {
      imageRef.current = newImage;
      
      // Reset crop mode and position
      setIsCropping(false);
      setCropRectVisible(false);
      setImagePosition({ x: 0, y: 0 });
      
      toast({
        title: "Image cropped",
        description: "Your image has been cropped successfully.",
      });
    };
  };

  const handleResetCrop = () => {
    if (!originalImageData || !canvasRef.current || !ctx) return;
    
    // Reset to original image
    imageRef.current = originalImageData;
    
    // Reset canvas size
    canvasRef.current.width = originalImageData.width;
    canvasRef.current.height = originalImageData.height;
    
    // Reset crop state
    setIsCropping(false);
    setCropRectVisible(false);
    setCroppedPreview(null);
    
    // Reset position
    setImagePosition({ x: 0, y: 0 });
    
    // Redraw
    renderCanvas();
    
    toast({
      title: "Crop reset",
      description: "Your image has been restored to its original dimensions.",
    });
  };

  const handleResetPosition = () => {
    setImagePosition({ x: 0, y: 0 });
    
    toast({
      title: "Position reset",
      description: "Your image position has been reset.",
    });
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    const timestamp = new Date().getTime();
    link.download = `edited_image_${timestamp}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    
    toast({
      title: "Image downloaded",
      description: "Your edited image has been downloaded successfully.",
    });
  };

  const handlePlatformPreset = (platform: string) => {
    switch (platform) {
      case "facebook":
        setIsCircular(true);
        setBorderWidth(0);
        setActiveFilter("none");
        break;
      case "instagram":
        setIsCircular(false);
        setBorderWidth(0);
        setActiveFilter("none");
        break;
      case "linkedin":
        setIsCircular(true);
        setBorderWidth(4);
        setBorderColor("#0077b5");
        setBorderGradient("");
        setActiveFilter("none");
        break;
      case "twitter":
        setIsCircular(true);
        setBorderWidth(0);
        setActiveFilter("none");
        break;
      case "youtube":
        setIsCircular(true);
        setBorderWidth(4);
        setBorderColor("#ff0000");
        setBorderGradient("");
        setActiveFilter("none");
        break;
      case "original":
        setIsCircular(false);
        setBorderWidth(0);
        setBorderGradient("");
        setActiveFilter("none");
        setRotation(0);
        setScale(1);
        setHorizontalFlip(false);
        setVerticalFlip(false);
        setImagePosition({ x: 0, y: 0 });
        break;
      default:
        break;
    }
  };

  // Main tabs for edit types
  const [activeTab, setActiveTab] = useState("crop");

  return (
    <div className="w-full bg-background text-foreground">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left side - Preview */}
        <div className="lg:col-span-2">
          <div className="bg-background/50 rounded-lg p-3 md:p-4 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2">
              <h2 className="text-lg md:text-xl font-bold">Preview</h2>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRotate(-90)}
                  className="bg-background/10 backdrop-blur-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRotate(90)}
                  className="bg-background/10 backdrop-blur-sm"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onBackToUpload}
                  className="bg-primary text-primary-foreground"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Back to Upload</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </div>
            </div>
            
            <div className="relative w-full flex justify-center mb-4 md:mb-6">
              <div 
                className={`max-h-[350px] md:max-h-[500px] overflow-auto flex justify-center items-center rounded-lg ${
                  isMovingImage 
                    ? 'cursor-grabbing' 
                    : isCropping 
                      ? cropMode === "draw" 
                        ? 'cursor-crosshair'
                        : cropMode?.includes('resize') 
                          ? `cursor-${cropMode.replace('resize-', '')}-resize` 
                          : cropMode === "move" 
                            ? 'cursor-move' 
                            : 'cursor-crosshair'
                      : 'cursor-grab'
                }`}
              >
                <canvas 
                  ref={canvasRef} 
                  className="max-w-full rounded-lg shadow-xl"
                  style={{ 
                    maxHeight: "100%",
                    filter: activeFilter !== "none" && !["grayscale", "sepia", "invert", "brightness", "contrast"].includes(activeFilter) 
                      ? `${activeFilter}(1)` 
                      : "none"
                  }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleCanvasMouseDown({
                      clientX: touch.clientX,
                      clientY: touch.clientY
                    } as any);
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    handleCanvasMouseMove({
                      clientX: touch.clientX,
                      clientY: touch.clientY
                    } as any);
                  }}
                  onTouchEnd={() => handleCanvasMouseUp()}
                />
              </div>
            </div>
            
            {croppedPreview && (
              <div className="mb-4 p-3 border border-primary/30 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Cropped Preview</h3>
                <div className="flex justify-center">
                  <img 
                    src={croppedPreview} 
                    alt="Cropped Preview" 
                    className="max-w-[200px] max-h-[200px] rounded-md shadow-md" 
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              <Button 
                variant="outline" 
                className="text-xs md:text-sm bg-background/10 backdrop-blur-sm border-primary/20"
                onClick={() => handleRotate(-90)}
                size="sm"
              >
                <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="truncate">Rotate Left</span>
              </Button>
              <Button 
                variant="outline" 
                className="text-xs md:text-sm bg-background/10 backdrop-blur-sm border-primary/20"
                onClick={() => handleRotate(90)}
                size="sm"
              >
                <RotateCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="truncate">Rotate Right</span>
              </Button>
              <Button 
                variant="outline" 
                className="text-xs md:text-sm bg-background/10 backdrop-blur-sm border-primary/20"
                onClick={() => handleZoom("in")}
                size="sm"
              >
                <ZoomIn className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="truncate">Zoom In</span>
              </Button>
              <Button 
                variant="outline" 
                className="text-xs md:text-sm bg-background/10 backdrop-blur-sm border-primary/20"
                onClick={() => handleZoom("out")}
                size="sm"
              >
                <ZoomOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="truncate">Zoom Out</span>
              </Button>
              <Button 
                variant={isMovingImage ? "default" : "outline"} 
                className={`text-xs md:text-sm ${!isMovingImage ? "bg-background/10 backdrop-blur-sm border-primary/20" : ""}`}
                onClick={() => setIsMovingImage(!isMovingImage)}
                size="sm"
              >
                <Move className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="truncate">Position</span>
              </Button>
              <Button 
                variant="outline" 
                className="text-xs md:text-sm bg-background/10 backdrop-blur-sm border-primary/20"
                onClick={handleResetPosition}
                size="sm"
              >
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="truncate">Reset Pos</span>
              </Button>
              <Button 
                variant="default" 
                className="col-span-2 text-xs md:text-sm"
                onClick={handleDownload}
                size="sm"
              >
                <Bold className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
        
        {/* Right side - Controls */}
        <div className="bg-background/50 rounded-lg p-3 md:p-4 backdrop-blur-sm">
          <div className="mb-4 overflow-x-auto">
            <div className="inline-flex rounded-md shadow-sm">
              <Button 
                variant={activeTab === "crop" ? "default" : "outline"}
                onClick={() => setActiveTab("crop")}
                className="rounded-l-md rounded-r-none text-xs md:text-sm"
                size="sm"
              >
                Crop
              </Button>
              <Button 
                variant={activeTab === "adjust" ? "default" : "outline"}
                onClick={() => setActiveTab("adjust")}
                className="rounded-none border-l-0 border-r-0 text-xs md:text-sm"
                size="sm"
              >
                Adjust
              </Button>
              <Button 
                variant={activeTab === "filters" ? "default" : "outline"}
                onClick={() => setActiveTab("filters")}
                className="rounded-r-md rounded-l-none text-xs md:text-sm"
                size="sm"
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Platform Presets */}
          <div className="mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-medium mb-2 md:mb-3">Platform Presets</h3>
            <div className="grid grid-cols-2 gap-1 md:gap-2 mb-2">
              <Button 
                variant="outline" 
                className="flex items-center justify-start gap-1 md:gap-2 bg-background/10 backdrop-blur-sm text-xs md:text-sm"
                onClick={() => handlePlatformPreset("facebook")}
                size="sm"
              >
                <Facebook className="h-3 w-3 md:h-4 md:w-4" />
                Facebook
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-start gap-1 md:gap-2 bg-background/10 backdrop-blur-sm text-xs md:text-sm"
                onClick={() => handlePlatformPreset("instagram")}
                size="sm"
              >
                <Instagram className="h-3 w-3 md:h-4 md:w-4" />
                Instagram
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-start gap-1 md:gap-2 bg-background/10 backdrop-blur-sm text-xs md:text-sm"
                onClick={() => handlePlatformPreset("youtube")}
                size="sm"
              >
                <Youtube className="h-3 w-3 md:h-4 md:w-4" />
                YouTube
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-start gap-1 md:gap-2 bg-background/10 backdrop-blur-sm text-xs md:text-sm"
                onClick={() => handlePlatformPreset("linkedin")}
                size="sm"
              >
                <Linkedin className="h-3 w-3 md:h-4 md:w-4" />
                LinkedIn
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-start gap-1 md:gap-2 bg-background/10 backdrop-blur-sm text-xs md:text-sm"
                onClick={() => handlePlatformPreset("twitter")}
                size="sm"
              >
                <Twitter className="h-3 w-3 md:h-4 md:w-4" />
                Twitter/X
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-start gap-1 md:gap-2 bg-background/10 backdrop-blur-sm text-xs md:text-sm"
                onClick={() => handlePlatformPreset("original")}
                size="sm"
              >
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
                Original
              </Button>
            </div>

            <h3 className="text-base md:text-lg font-medium mb-2 mt-4 md:mt-6">Transform</h3>
            <div className="grid grid-cols-2 gap-1 md:gap-2">
              <Button 
                variant="outline" 
                className="flex items-center justify-start gap-1 md:gap-2 bg-background/10 backdrop-blur-sm text-xs md:text-sm"
                onClick={() => handleFlip("horizontal")}
                size="sm"
              >
                <FlipHorizontal className="h-3 w-3 md:h-4 md:w-4" />
                Flip H
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-start gap-1 md:gap-2 bg-background/10 backdrop-blur-sm text-xs md:text-sm"
                onClick={() => handleFlip("vertical")}
                size="sm"
              >
                <FlipVertical className="h-3 w-3 md:h-4 md:w-4" />
                Flip V
              </Button>
            </div>
          </div>

          {/* Tab content */}
          <div className="mt-4">
            {activeTab === "adjust" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs md:text-sm font-medium mb-2">Rotation</h3>
                  <Slider
                    value={[rotation]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={(value) => setRotation(value[0])}
                    className="mb-1"
                  />
                  <div className="text-xs text-muted-foreground">
                    {rotation}° degrees
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs md:text-sm font-medium mb-2">Scale</h3>
                  <Slider
                    value={[scale * 100]}
                    min={10}
                    max={300}
                    step={5}
                    onValueChange={(value) => setScale(value[0] / 100)}
                    className="mb-1"
                  />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(scale * 100)}%
                  </div>
                </div>

                <div>
                  <h3 className="text-xs md:text-sm font-medium mb-2">Border Width</h3>
                  <Slider
                    value={[borderWidth]}
                    min={0}
                    max={50}
                    step={1}
                    onValueChange={(value) => setBorderWidth(value[0])}
                    className="mb-1"
                  />
                  <div className="text-xs text-muted-foreground">
                    {borderWidth}px
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs md:text-sm font-medium mb-2">Border Style</h3>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Button
                      variant={!borderGradient ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBorderGradient("")}
                      className="text-xs md:text-sm"
                    >
                      Solid Color
                    </Button>
                    <Button
                      variant={borderGradient ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBorderGradient(gradientPresets[0].value)}
                      className="text-xs md:text-sm"
                    >
                      Gradient
                    </Button>
                  </div>
                  
                  {!borderGradient ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full border" 
                        style={{ backgroundColor: borderColor }}
                      />
                      <Input
                        type="color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-20 h-8 p-1"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {gradientPresets.slice(0, -1).map((preset, index) => (
                        <div 
                          key={index}
                          className={`h-8 rounded-md flex items-center px-2 cursor-pointer ${borderGradient === preset.value ? 'ring-2 ring-primary' : ''}`}
                          style={{ background: preset.value || borderColor }}
                          onClick={() => setBorderGradient(preset.value)}
                        >
                          <span className="text-xs font-medium text-white drop-shadow-md">{preset.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xs md:text-sm font-medium mb-2">Shape</h3>
                  <Button
                    variant={isCircular ? "default" : "outline"}
                    onClick={handleCircleToggle}
                    className="w-full text-xs md:text-sm"
                    size="sm"
                  >
                    <Circle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    {isCircular ? "Rectangular" : "Circular"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "filters" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-1 md:gap-2">
                  <div
                    onClick={() => setActiveFilter("none")}
                    className={`cursor-pointer p-2 rounded-md text-center ${
                      activeFilter === "none" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm font-medium">None</div>
                  </div>
                  <div
                    onClick={() => setActiveFilter("grayscale")}
                    className={`cursor-pointer p-2 rounded-md text-center ${
                      activeFilter === "grayscale" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm font-medium">Grayscale</div>
                  </div>
                  <div
                    onClick={() => setActiveFilter("sepia")}
                    className={`cursor-pointer p-2 rounded-md text-center ${
                      activeFilter === "sepia" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm font-medium">Sepia</div>
                  </div>
                  <div
                    onClick={() => setActiveFilter("invert")}
                    className={`cursor-pointer p-2 rounded-md text-center ${
                      activeFilter === "invert" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm font-medium">Invert</div>
                  </div>
                  <div
                    onClick={() => setActiveFilter("brightness")}
                    className={`cursor-pointer p-2 rounded-md text-center ${
                      activeFilter === "brightness" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm font-medium">Brighten</div>
                  </div>
                  <div
                    onClick={() => setActiveFilter("contrast")}
                    className={`cursor-pointer p-2 rounded-md text-center ${
                      activeFilter === "contrast" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm font-medium">Contrast</div>
                  </div>
                  <div
                    onClick={() => setActiveFilter("blur(3px)")}
                    className={`cursor-pointer p-2 rounded-md text-center ${
                      activeFilter === "blur(3px)" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm font-medium">Blur</div>
                  </div>
                  <div
                    onClick={() => setActiveFilter("hue-rotate(90deg)")}
                    className={`cursor-pointer p-2 rounded-md text-center ${
                      activeFilter === "hue-rotate(90deg)" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm font-medium">Hue Shift</div>
                  </div>
                  <div
                    onClick={() => setActiveFilter("saturate(2)")}
                    className={`cursor-pointer p-2 rounded-md text-center ${
                      activeFilter === "saturate(2)" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                    }`}
                  >
                    <div className="text-xs md:text-sm font-medium">Vibrant</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "crop" && (
              <div className="space-y-3 md:space-y-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {!isCropping ? "Select a preset or use custom cropping" : "Draw on the canvas to select crop area"}
                </p>

                <div className="grid grid-cols-2 gap-1 md:gap-2">
                  <Button 
                    variant="outline" 
                    className="bg-background/10 backdrop-blur-sm border-primary/20 text-xs md:text-sm"
                    onClick={handleCircleToggle}
                    size="sm"
                  >
                    <Circle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Circle Crop
                  </Button>
                  <Button 
                    variant={isCropping ? "default" : "outline"} 
                    className={`text-xs md:text-sm ${!isCropping ? "bg-background/10 backdrop-blur-sm border-primary/20" : ""}`}
                    onClick={handleCropToggle}
                    size="sm"
                  >
                    <Crop className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    {isCropping ? "Apply Crop" : "Custom Crop"}
                  </Button>
                </div>

                {isCropping && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2 md:mb-3">
                      Click and drag on the image to select the area you want to keep.
                    </p>
                    
                    <div className="mb-4">
                      <h3 className="text-xs md:text-sm font-medium mb-2">Aspect Ratio</h3>
                      <div className="grid grid-cols-3 gap-1">
                        {aspectRatioOptions.map((option) => (
                          <Button 
                            key={option.name}
                            variant={selectedAspectRatio === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedAspectRatio(option.value)}
                            className="text-xs h-8"
                          >
                            {option.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline"
                        onClick={handleResetCrop}
                        className="w-full bg-background/10 backdrop-blur-sm border-primary/20 text-xs md:text-sm"
                        size="sm"
                      >
                        <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Reset Crop
                      </Button>
                      
                      <Button 
                        variant="default"
                        onClick={handleCropToggle}
                        className="w-full text-xs md:text-sm"
                        size="sm"
                      >
                        <Crop className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Apply Crop
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
