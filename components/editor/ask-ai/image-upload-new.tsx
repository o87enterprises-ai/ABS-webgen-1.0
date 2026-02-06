import { useRef, useState } from "react";
import {
  CheckCircle,
  ImageIcon,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Loading from "@/components/loading";
import { useAi } from "@/hooks/useAi";

export interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string;
  file: File;
}

interface ImageUploadNewProps {
  uploadedImages: UploadedImage[];
  setUploadedImages: (images: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => void;
  disabled?: boolean;
}

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

      // Convert to base64 data URL
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newImages.push({
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        dataUrl,
        file,
      });
    }

    setUploadedImages(prev => [...prev, ...newImages]);
    setIsProcessing(false);
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
    // Also remove from selected files if it was selected
    const imageToRemove = uploadedImages.find(img => img.id === id);
    if (imageToRemove && selectedFiles.includes(imageToRemove.id)) {
      setSelectedFiles(selectedFiles.filter(f => f !== imageToRemove.id));
    }
  };

  const toggleSelectImage = (id: string) => {
    if (selectedFiles.includes(id)) {
      setSelectedFiles(selectedFiles.filter(f => f !== id));
    } else {
      setSelectedFiles([...selectedFiles, id]);
    }
  };

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
                      src={image.dataUrl}
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

          {selectedFiles.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>{selectedFiles.length}</strong> image(s) selected - these will be included in your design
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
                  Processing...
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
              Supports PNG, JPG, GIF, SVG. Images will be embedded as base64.
            </p>
          </div>
        </main>
      </PopoverContent>
    </Popover>
  );
};
