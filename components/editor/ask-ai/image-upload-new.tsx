import { useRef, useState } from "react";
import {
  CheckCircle,
  ImageIcon,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Loading from "@/components/loading";
import { useAi } from "@/hooks/useAi";
import { toast } from "sonner";

export interface UploadedImage {
  id: string;
  name: string;
  previewUrl: string; // Small base64 for preview display
  serverUrl: string;  // Server path like /uploads/123.png for LLM
}

interface ImageUploadNewProps {
  uploadedImages: UploadedImage[];
  setUploadedImages: (images: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => void;
  disabled?: boolean;
}

// Create a small preview thumbnail (max 100x100)
const createPreviewThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 100;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const ImageUploadNew = ({
  uploadedImages,
  setUploadedImages,
  disabled
}: ImageUploadNewProps) => {
  const { selectedFiles, setSelectedFiles, globalAiLoading } = useAi();
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    const newImages: UploadedImage[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      try {
        // Upload to server
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!result.ok) {
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
          continue;
        }

        // Create small preview thumbnail for display
        const previewUrl = await createPreviewThumbnail(file);

        const imageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        newImages.push({
          id: imageId,
          name: file.name,
          previewUrl,
          serverUrl: result.url, // e.g., /uploads/123-abc.png
        });

        // Auto-select the newly uploaded image
        setSelectedFiles([...selectedFiles, imageId]);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
      toast.success(`Uploaded ${newImages.length} image(s)`);
    }

    setIsProcessing(false);
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    // Also remove from selected files if it was selected
    if (selectedFiles.includes(id)) {
      setSelectedFiles(selectedFiles.filter(f => f !== id));
    }
  };

  const toggleSelectImage = (id: string) => {
    if (selectedFiles.includes(id)) {
      setSelectedFiles(selectedFiles.filter(f => f !== id));
    } else {
      setSelectedFiles([...selectedFiles, id]);
    }
  };

  // Count selected images (only temp- prefixed IDs are uploaded images)
  const selectedImageCount = selectedFiles.filter(f => f.startsWith('temp-')).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="xs"
          variant={open ? "default" : "outline"}
          className="!rounded-md gap-1.5"
          disabled={disabled || globalAiLoading}
        >
          <ImageIcon className="size-3.5" />
          {uploadedImages.length > 0 ? `Images (${uploadedImages.length})` : "Add Images"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="!rounded-2xl !p-0 !bg-white !border-neutral-100 min-w-xs text-center overflow-hidden"
      >
        <header className="bg-neutral-50 p-6 border-b border-neutral-200/60">
          <div className="flex items-center justify-center -space-x-4 mb-3">
            <div className="size-9 rounded-full bg-pink-200 shadow-2xs flex items-center justify-center text-xl opacity-50">
              🎨
            </div>
            <div className="size-11 rounded-full bg-amber-200 shadow-2xl flex items-center justify-center text-2xl z-2">
              🖼️
            </div>
            <div className="size-9 rounded-full bg-sky-200 shadow-2xs flex items-center justify-center text-xl opacity-50">
              💻
            </div>
          </div>
          <p className="text-xl font-semibold text-neutral-950">
            Add Images for Your Design
          </p>
          <p className="text-sm text-neutral-500 mt-1.5">
            Upload logos, icons, or reference images to include in your generated pages
          </p>
        </header>
        <main className="space-y-4 p-5">
          <div>
            <p className="text-xs text-left text-neutral-700 mb-2">
              Your Images {uploadedImages.length > 0 && `(${uploadedImages.length})`}
            </p>
            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 flex-wrap max-h-40 overflow-y-auto">
                {uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer"
                    onClick={() => toggleSelectImage(image.id)}
                  >
                    <img
                      src={image.previewUrl}
                      alt={image.name}
                      className="object-cover w-full rounded-md aspect-square border-2 border-white hover:border-blue-400 transition-all"
                    />
                    {selectedFiles.includes(image.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                        <CheckCircle className="size-6 text-white" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                      className="absolute -top-1 -right-1 size-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-mono flex flex-col items-center gap-1 pt-2">
                <ImageIcon className="size-4" />
                No images uploaded yet
              </p>
            )}
          </div>

          {selectedImageCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>{selectedImageCount}</strong> image(s) selected - these will be included in your design
              </p>
            </div>
          )}

          <div>
            <Button
              variant="black"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loading overlay={false} className="ml-2 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Upload Images
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <p className="text-xs text-neutral-400 mt-2">
              Supports PNG, JPG, GIF, SVG. Images are saved to server.
            </p>
          </div>
        </main>
      </PopoverContent>
    </Popover>
  );
};
