import { useState } from "react";
import { useLocalStorage } from "react-use";
import { ArrowUp, Dice6 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PromptBuilder } from "./prompt-builder";
import { EnhancedSettings } from "@/types";
import { Settings } from "./settings";
import classNames from "classnames";
import { PROMPTS_FOR_AI } from "@/lib/prompts";
import { ImageUploadNew, UploadedImage } from "./image-upload-new";
import { PageTemplates, PageTemplate } from "./page-templates";

export const FakeAskAi = () => {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [openProvider, setOpenProvider] = useState(false);
  const [enhancedSettings, setEnhancedSettings, removeEnhancedSettings] =
    useLocalStorage<EnhancedSettings>("deepsite-enhancedSettings", {
      isActive: true,
      primaryColor: undefined,
      secondaryColor: undefined,
      theme: undefined,
    });
  const [, setPromptStorage] = useLocalStorage("prompt", "");
  const [, setImagesStorage] = useLocalStorage<UploadedImage[]>("deepsite-uploadedImages", []);
  const [, setTemplateStorage] = useLocalStorage<PageTemplate | null>("deepsite-selectedTemplate", null);
  const [randomPromptLoading, setRandomPromptLoading] = useState(false);

  // Image uploads
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);

  // Page template selection
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | null>(null);

  const callAi = async () => {
    setPromptStorage(prompt);
    // Store images and template in localStorage for the /new page
    const selectedImages = uploadedImages.filter(img => selectedImageIds.includes(img.id));
    setImagesStorage(selectedImages);
    setTemplateStorage(selectedTemplate);
    router.push("/new");
  };

  const randomPrompt = () => {
    setRandomPromptLoading(true);
    setTimeout(() => {
      setPrompt(
        PROMPTS_FOR_AI[Math.floor(Math.random() * PROMPTS_FOR_AI.length)]
      );
      setRandomPromptLoading(false);
    }, 400);
  };

  // Get selected images for display
  const selectedImages = uploadedImages.filter(img => selectedImageIds.includes(img.id));

  // Handle image selection toggle
  const handleImageSelect = (imageId: string) => {
    setSelectedImageIds(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // Handle image upload - auto-select new images
  const handleImagesChange = (images: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => {
    const resolvedImages = typeof images === 'function' ? images(uploadedImages) : images;
    const newImages = resolvedImages.filter(img => !uploadedImages.find(u => u.id === img.id));
    setUploadedImages(resolvedImages);
    // Auto-select newly uploaded images
    if (newImages.length > 0) {
      setSelectedImageIds(prev => [...prev, ...newImages.map(img => img.id)]);
    }
  };

  return (
    <div className="p-3 w-full max-w-xl mx-auto">
      <div className="relative bg-neutral-800 border border-neutral-700 rounded-2xl ring-[4px] focus-within:ring-neutral-500/30 focus-within:border-neutral-600 ring-transparent z-20 w-full group">
        {/* Show selected images */}
        {selectedImages.length > 0 && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-400">Images:</span>
              {selectedImages.map((img) => (
                <div
                  key={img.id}
                  className="flex items-center gap-1.5 bg-neutral-700 rounded-md px-2 py-1"
                >
                  <img
                    src={img.previewUrl || img.serverUrl}
                    alt={img.name}
                    className="size-5 rounded object-cover"
                  />
                  <span className="text-xs text-neutral-300 max-w-[100px] truncate">
                    {img.name}
                  </span>
                  <button
                    onClick={() => setSelectedImageIds(selectedImageIds.filter(id => id !== img.id))}
                    className="text-neutral-400 hover:text-neutral-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show selected template */}
        {selectedTemplate && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-700/50 rounded-lg px-3 py-2">
              <span className="text-xs text-blue-300">Template:</span>
              <span className="text-sm text-blue-200 font-medium">{selectedTemplate.name}</span>
              <span className="text-xs text-blue-400">
                ({selectedTemplate.pages.length} pages)
              </span>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="ml-auto text-blue-400 hover:text-blue-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="w-full relative flex items-start justify-between pr-4 pt-4">
          <textarea
            className="w-full bg-transparent text-sm outline-none text-white placeholder:text-neutral-400 px-4 pb-4 resize-none"
            placeholder={
              selectedTemplate
                ? `Describe your ${selectedTemplate.name.toLowerCase()}...`
                : "Ask DeepSite anything..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                callAi();
              }
            }}
          />
          <Button
            size="iconXs"
            variant="outline"
            className="!rounded-md"
            onClick={() => randomPrompt()}
          >
            <Dice6
              className={classNames("size-4", {
                "animate-spin animation-duration-500": randomPromptLoading,
              })}
            />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 pb-3 mt-2">
          <div className="flex-1 flex items-center justify-start gap-1.5 flex-wrap">
            <PromptBuilder
              enhancedSettings={enhancedSettings!}
              setEnhancedSettings={setEnhancedSettings}
            />
            <Settings
              open={openProvider}
              isFollowUp={false}
              error=""
              onClose={setOpenProvider}
            />
            <ImageUploadNew
              uploadedImages={uploadedImages}
              setUploadedImages={handleImagesChange}
              disabled={false}
            />
            <PageTemplates
              selectedTemplate={selectedTemplate}
              onSelectTemplate={setSelectedTemplate}
              disabled={false}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="iconXs"
              variant="outline"
              className="!rounded-md"
              onClick={() => callAi()}
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
