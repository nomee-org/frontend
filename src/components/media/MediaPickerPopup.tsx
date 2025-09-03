import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  Upload,
  Crop as CropIcon,
  Scissors,
  Palette,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "react-image-crop/dist/ReactCrop.css";
import "./MediaPickerPopup.css";

export interface ProcessedMediaFile {
  id: string;
  file: File;
  type: "image" | "video";
  preview: string;
  originalFile?: File;
}

interface MediaPickerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: ProcessedMediaFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  existingFiles?: ProcessedMediaFile[];
}

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sepia: number;
}

const DEFAULT_FILTERS: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  sepia: 0,
};

export function MediaPickerPopup({
  isOpen,
  onClose,
  onFilesSelected,
  maxFiles = 4,
  acceptedTypes = ["image/*", "video/*"],
  existingFiles = [],
}: MediaPickerPopupProps) {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg>();
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState<ProcessedMediaFile[]>(existingFiles);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [editMode, setEditMode] = useState<"none" | "crop" | "filter" | "trim">("none");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [filters, setFilters] = useState<ImageFilters>(DEFAULT_FILTERS);
  const [videoTrimStart, setVideoTrimStart] = useState(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load FFmpeg for video processing
  useEffect(() => {
    const loadFFmpeg = async () => {
      if (ffmpegRef.current) return;
      
      try {
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;
        
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        
        setFfmpegLoaded(true);
      } catch (error) {
        console.warn("FFmpeg failed to load:", error);
        toast.error("Video editing not available");
      }
    };

    if (isOpen) {
      loadFFmpeg();
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const availableSlots = maxFiles - selectedFiles.length;
    const filesToProcess = files.slice(0, availableSlots);

    const newFiles: ProcessedMediaFile[] = [];

    filesToProcess.forEach((file) => {
      // Validate file type
      const isValidType = acceptedTypes.some(type => {
        if (type === "image/*") return file.type.startsWith("image/");
        if (type === "video/*") return file.type.startsWith("video/");
        return file.type === type;
      });

      if (!isValidType) {
        toast.error(`${file.name} is not a supported file type`);
        return;
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = URL.createObjectURL(file);
      const type = file.type.startsWith("image/") ? "image" : "video";

      newFiles.push({
        id,
        file,
        type,
        preview,
        originalFile: file,
      });
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      const newFiles = prev.filter(f => f.id !== fileId);
      
      // Adjust current index if needed
      if (currentFileIndex >= newFiles.length && newFiles.length > 0) {
        setCurrentFileIndex(newFiles.length - 1);
      }
      
      return newFiles;
    });
  };

  const applyCrop = async () => {
    if (!completedCrop || !selectedFiles[currentFileIndex]) return;

    setIsProcessing(true);
    try {
      const currentFile = selectedFiles[currentFileIndex];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      // Set crossorigin to handle potential CORS issues
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = currentFile.preview;
      });

      // Use the completed crop dimensions directly
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      if (ctx) {
        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate scale factors based on displayed vs natural image size  
        const imageElement = document.querySelector('.ReactCrop__image') as HTMLImageElement;
        const scaleX = img.naturalWidth / (imageElement?.clientWidth || img.naturalWidth);
        const scaleY = img.naturalHeight / (imageElement?.clientHeight || img.naturalHeight);

        ctx.drawImage(
          img,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          completedCrop.width,
          completedCrop.height
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], currentFile.file.name, {
              type: currentFile.file.type,
            });
            
            URL.revokeObjectURL(currentFile.preview);
            const newPreview = URL.createObjectURL(croppedFile);

            setSelectedFiles(prev => prev.map((file, index) => 
              index === currentFileIndex 
                ? { ...file, file: croppedFile, preview: newPreview }
                : file
            ));

            setEditMode("none");
            setCrop(undefined);
            setCompletedCrop(undefined);
            toast.success("Image cropped successfully");
          }
        }, currentFile.file.type, 0.95);
      }
    } catch (error) {
      console.error("Crop error:", error);
      toast.error("Failed to crop image");
    } finally {
      setIsProcessing(false);
    }
  };

  const applyFilters = async () => {
    setIsProcessing(true);
    try {
      const currentFile = selectedFiles[currentFileIndex];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = currentFile.preview;
      });

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (ctx) {
        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) sepia(${filters.sepia}%)`;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const filteredFile = new File([blob], currentFile.file.name, {
              type: currentFile.file.type,
            });
            
            URL.revokeObjectURL(currentFile.preview);
            const newPreview = URL.createObjectURL(filteredFile);

            setSelectedFiles(prev => prev.map((file, index) => 
              index === currentFileIndex 
                ? { ...file, file: filteredFile, preview: newPreview }
                : file
            ));

            setEditMode("none");
            setFilters(DEFAULT_FILTERS);
            toast.success("Filters applied successfully");
          }
        }, currentFile.file.type);
      }
    } catch (error) {
      toast.error("Failed to apply filters");
    } finally {
      setIsProcessing(false);
    }
  };

  const trimVideo = async () => {
    if (!ffmpegLoaded || !ffmpegRef.current || !selectedFiles[currentFileIndex]) return;

    setIsProcessing(true);
    try {
      const currentFile = selectedFiles[currentFileIndex];
      const ffmpeg = ffmpegRef.current;

      // Create a video element to get duration
      const video = document.createElement('video');
      video.src = currentFile.preview;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      const duration = video.duration;
      const startTime = (videoTrimStart / 100) * duration;
      const endTime = (videoTrimEnd / 100) * duration;
      const trimDuration = endTime - startTime;

      await ffmpeg.writeFile("input.mp4", await fetchFile(currentFile.file));

      await ffmpeg.exec([
        "-i", "input.mp4",
        "-ss", startTime.toString(),
        "-t", trimDuration.toString(),
        "-c", "copy",
        "output.mp4"
      ]);

      const data = await ffmpeg.readFile("output.mp4") as Uint8Array;
      const trimmedBlob = new Blob([new Uint8Array(data)], { type: "video/mp4" });
      const trimmedFile = new File([trimmedBlob], currentFile.file.name, {
        type: "video/mp4",
      });

      URL.revokeObjectURL(currentFile.preview);
      const newPreview = URL.createObjectURL(trimmedFile);

      setSelectedFiles(prev => prev.map((file, index) => 
        index === currentFileIndex 
          ? { ...file, file: trimmedFile, preview: newPreview }
          : file
      ));

      setEditMode("none");
      setVideoTrimStart(0);
      setVideoTrimEnd(100);
      toast.success("Video trimmed successfully");
    } catch (error) {
      console.error("Video trim error:", error);
      toast.error("Failed to trim video");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    onFilesSelected(selectedFiles);
    handleCloseAfterSubmit();
  };

  const handleClose = () => {
    // Cleanup: revoke all object URLs and reset state
    selectedFiles.forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
    setSelectedFiles([]);
    setCurrentFileIndex(0);
    setEditMode("none");
    setCrop(undefined);
    setCompletedCrop(undefined);
    setFilters(DEFAULT_FILTERS);
    setVideoTrimStart(0);
    setVideoTrimEnd(100);
    onClose();
  };

  const handleCloseAfterSubmit = () => {
    // Reset state but don't revoke object URLs since files are being used
    setSelectedFiles([]);
    setCurrentFileIndex(0);
    setEditMode("none");
    setCrop(undefined);
    setCompletedCrop(undefined);
    setFilters(DEFAULT_FILTERS);
    setVideoTrimStart(0);
    setVideoTrimEnd(100);
    onClose();
  };

  const resetToOriginal = () => {
    const currentFile = selectedFiles[currentFileIndex];
    if (currentFile.originalFile) {
      URL.revokeObjectURL(currentFile.preview);
      const newPreview = URL.createObjectURL(currentFile.originalFile);
      
      setSelectedFiles(prev => prev.map((file, index) => 
        index === currentFileIndex 
          ? { ...file, file: currentFile.originalFile!, preview: newPreview }
          : file
      ));
      
      setEditMode("none");
      setCrop(undefined);
      setCompletedCrop(undefined);
      setFilters(DEFAULT_FILTERS);
      toast.success("Reset to original");
    }
  };

  const renderEditingTools = () => {
    const currentFile = selectedFiles[currentFileIndex];
    if (!currentFile) return null;

    switch (editMode) {
      case "crop":
        return currentFile.type === "image" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Crop Image</h3>
              <div className="space-x-2">
                <Button onClick={() => setEditMode("none")} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button onClick={applyCrop} disabled={!completedCrop || isProcessing} size="sm">
                  {isProcessing ? "Processing..." : "Apply"}
                </Button>
              </div>
            </div>
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={undefined}
            >
              <img src={currentFile.preview} className="max-h-64 mx-auto" />
            </ReactCrop>
          </div>
        ) : null;

      case "filter":
        return currentFile.type === "image" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Apply Filters</h3>
              <div className="space-x-2">
                <Button onClick={() => setEditMode("none")} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button onClick={applyFilters} disabled={isProcessing} size="sm">
                  {isProcessing ? "Processing..." : "Apply"}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Brightness</label>
                <Slider
                  value={[filters.brightness]}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, brightness: value[0] }))}
                  max={200}
                  min={0}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contrast</label>
                <Slider
                  value={[filters.contrast]}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, contrast: value[0] }))}
                  max={200}
                  min={0}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Saturation</label>
                <Slider
                  value={[filters.saturation]}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, saturation: value[0] }))}
                  max={200}
                  min={0}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Blur</label>
                <Slider
                  value={[filters.blur]}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, blur: value[0] }))}
                  max={10}
                  min={0}
                  step={0.1}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sepia</label>
                <Slider
                  value={[filters.sepia]}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sepia: value[0] }))}
                  max={100}
                  min={0}
                  step={1}
                  className="mt-1"
                />
              </div>
            </div>

            <div 
              className="preview-container"
              style={{
                filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) sepia(${filters.sepia}%)`
              }}
            >
              <img src={currentFile.preview} className="max-h-32 mx-auto rounded" />
            </div>
          </div>
        ) : null;

      case "trim":
        return currentFile.type === "video" && ffmpegLoaded ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Trim Video</h3>
              <div className="space-x-2">
                <Button onClick={() => setEditMode("none")} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button onClick={trimVideo} disabled={isProcessing} size="sm">
                  {isProcessing ? "Processing..." : "Apply"}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Start ({videoTrimStart}%)</label>
                <Slider
                  value={[videoTrimStart]}
                  onValueChange={(value) => setVideoTrimStart(value[0])}
                  max={videoTrimEnd - 1}
                  min={0}
                  step={1}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End ({videoTrimEnd}%)</label>
                <Slider
                  value={[videoTrimEnd]}
                  onValueChange={(value) => setVideoTrimEnd(value[0])}
                  max={100}
                  min={videoTrimStart + 1}
                  step={1}
                  className="mt-1"
                />
              </div>
            </div>

            <video src={currentFile.preview} controls className="max-h-32 mx-auto rounded" />
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const content = (
    <div className="space-y-4">
      {selectedFiles.length === 0 ? (
        <div className="text-center py-8">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Select media files to get started</p>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Files
          </Button>
        </div>
      ) : (
        <>
          {/* File count and controls */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedFiles.length} of {maxFiles} files
            </span>
            <div className="space-x-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedFiles.length >= maxFiles}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
              <Button onClick={resetToOriginal} variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </div>

          {editMode === "none" ? (
            <>
              {/* Media carousel */}
              <div className="relative h-80">
                <Swiper
                  modules={[Navigation, Pagination]}
                  navigation
                  pagination={{ clickable: true }}
                  spaceBetween={16}
                  slidesPerView={1}
                  onSlideChange={(swiper) => setCurrentFileIndex(swiper.activeIndex)}
                  className="media-swiper h-full"
                  style={{ height: '100%' }}
                >
                  {selectedFiles.map((file, index) => (
                    <SwiperSlide key={file.id}>
                      <div className="relative group w-full h-full flex items-center justify-center">
                        {file.type === "image" ? (
                          <img
                            src={file.preview}
                            alt={`Media ${index + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg bg-muted"
                          />
                        ) : (
                          <video
                            src={file.preview}
                            controls
                            className="max-w-full max-h-full object-contain rounded-lg bg-muted"
                          />
                        )}
                        <Button
                          onClick={() => removeFile(file.id)}
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Editing tools */}
              <div className="flex justify-center space-x-2">
                {selectedFiles[currentFileIndex]?.type === "image" && (
                  <>
                    <Button
                      onClick={() => setEditMode("crop")}
                      variant="outline"
                      size={isMobile ? "icon" : "sm"}
                      className={isMobile ? "h-10 w-10" : ""}
                    >
                      <CropIcon className="h-4 w-4" />
                      {!isMobile && <span className="ml-1">Crop</span>}
                    </Button>
                    <Button
                      onClick={() => setEditMode("filter")}
                      variant="outline"
                      size={isMobile ? "icon" : "sm"}
                      className={isMobile ? "h-10 w-10" : ""}
                    >
                      <Palette className="h-4 w-4" />
                      {!isMobile && <span className="ml-1">Filters</span>}
                    </Button>
                  </>
                )}
                {selectedFiles[currentFileIndex]?.type === "video" && ffmpegLoaded && (
                  <Button
                    onClick={() => setEditMode("trim")}
                    variant="outline"
                    size={isMobile ? "icon" : "sm"}
                    className={isMobile ? "h-10 w-10" : ""}
                  >
                    <Scissors className="h-4 w-4" />
                    {!isMobile && <span className="ml-1">Trim</span>}
                  </Button>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  Use {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          ) : (
            renderEditingTools()
          )}
        </>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Media Picker</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto flex-1">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Media Picker</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}