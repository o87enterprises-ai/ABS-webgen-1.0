import { useRef, useState, useEffect } from "react";
import classNames from "classnames";
import { ArrowUp, ChevronDown, CircleStop, Dice6 } from "lucide-react";
import { useLocalStorage, useUpdateEffect, useMount } from "react-use";
import { toast } from "sonner";

import { useAi } from "@/hooks/useAi";
import { useEditor } from "@/hooks/useEditor";
import { EnhancedSettings, Project } from "@/types";
import { SelectedFiles } from "@/components/editor/ask-ai/selected-files";
import { SelectedHtmlElement } from "@/components/editor/ask-ai/selected-html-element";
import { AiLoading } from "@/components/editor/ask-ai/loading";
import { Button } from "@/components/ui/button";
import { Uploader } from "@/components/editor/ask-ai/uploader";
import { ReImagine } from "@/components/editor/ask-ai/re-imagine";
import { Selector } from "@/components/editor/ask-ai/selector";
import { PromptBuilder } from "@/components/editor/ask-ai/prompt-builder";
import { useUser } from "@/hooks/useUser";
import { useLoginModal } from "@/components/contexts/login-context";
import { Settings } from "./settings";
import { useProModal } from "@/components/contexts/pro-context";
import { MAX_FREE_PROJECTS } from "@/lib/utils";
import { PROMPTS_FOR_AI } from "@/lib/prompts";
import { ImageUploadNew, UploadedImage } from "./image-upload-new";
import { PageTemplates, PageTemplate } from "./page-templates";

export const AskAi = ({
  project,
  isNew,
  onScrollToBottom,
}: {
  project?: Project;
  files?: string[];
  isNew?: boolean;
  onScrollToBottom?: () => void;
}) => {
  const { user, projects } = useUser();
  const { isSameHtml, isUploading, pages, isLoadingProject } = useEditor();
  const {
    isAiWorking,
    isThinking,
    selectedFiles,
    setSelectedFiles,
    selectedElement,
    setSelectedElement,
    setIsThinking,
    callAiNewProject,
    callAiFollowUp,
    setModel,
    selectedModel,
    audio: hookAudio,
    cancelRequest,
  } = useAi(onScrollToBottom);
  const { openLoginModal } = useLoginModal();
  const { openProModal } = useProModal();
  const [openProvider, setOpenProvider] = useState(false);
  const [providerError, setProviderError] = useState("");
  const refThink = useRef<HTMLDivElement>(null);

  const [enhancedSettings, setEnhancedSettings, removeEnhancedSettings] =
    useLocalStorage<EnhancedSettings>("deepsite-enhancedSettings", {
      isActive: false,
      primaryColor: undefined,
      secondaryColor: undefined,
      theme: undefined,
    });
  const [promptStorage, , removePromptStorage] = useLocalStorage("prompt", "");

  const [isFollowUp, setIsFollowUp] = useState(true);
  const [prompt, setPrompt] = useState(
    promptStorage && promptStorage.trim() !== "" ? promptStorage : ""
  );
  const [think, setThink] = useState("");
  const [openThink, setOpenThink] = useState(false);
  const [randomPromptLoading, setRandomPromptLoading] = useState(false);

  // New project image uploads (stored locally until project is created)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [storedImages, , removeStoredImages] = useLocalStorage<UploadedImage[]>("deepsite-uploadedImages", []);
  const [storedTemplate, , removeStoredTemplate] = useLocalStorage<PageTemplate | null>("deepsite-selectedTemplate", null);

  // Page template selection
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | null>(null);

  // Track if we should auto-call AI after loading stored data
  const [shouldAutoCall, setShouldAutoCall] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useMount(() => {
    // Load stored images from homepage
    if (isNew && storedImages && storedImages.length > 0) {
      setUploadedImages(storedImages);
      setSelectedFiles(storedImages.map(img => img.id));
      removeStoredImages();
    }
    setImagesLoaded(true); // Mark images as loaded (even if empty)

    // Load stored template from homepage
    if (isNew && storedTemplate) {
      setSelectedTemplate(storedTemplate);
      removeStoredTemplate();
    }

    // Mark that we should auto-call if there's a stored prompt
    if (promptStorage && promptStorage.trim() !== "") {
      setShouldAutoCall(true);
    }
  });

  // Auto-call AI after images have been loaded into state
  useEffect(() => {
    if (shouldAutoCall && imagesLoaded && prompt.trim()) {
      setShouldAutoCall(false); // Prevent re-triggering
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        callAi();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoCall, imagesLoaded, uploadedImages]);

  // Build the enhanced prompt with images and template info
  const buildEnhancedPrompt = (basePrompt: string): string => {
    let enhancedPrompt = basePrompt;

    // Add page template instructions if selected
    if (selectedTemplate) {
      enhancedPrompt += `\n\n## Page Structure Requirements:
I want you to create a ${selectedTemplate.name} website with the following pages:
${selectedTemplate.pages.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Make sure each page has:
- Consistent navigation linking all pages together
- Matching design system and color scheme
- Proper semantic HTML structure
- Mobile-responsive layout`;
    }

    // Add uploaded images info
    if (uploadedImages.length > 0) {
      const selectedImageIds = selectedFiles.filter(f => f.startsWith('temp-'));
      const selectedImages = uploadedImages.filter(img => selectedImageIds.includes(img.id));

      if (selectedImages.length > 0) {
        enhancedPrompt += `\n\n## Images to Include:
I'm providing ${selectedImages.length} image(s) to use in the design:
${selectedImages.map((img, i) => `${i + 1}. "${img.name}" - Use this image in the design where appropriate`).join('\n')}

The images are provided as base64 data URLs. Embed them directly in the HTML using <img src="[base64-data-url]"> tags.`;
      }
    }

    return enhancedPrompt;
  };

  // Get image URLs for the API call
  const getImageDataForApi = () => {
    const selectedImageIds = selectedFiles.filter(f => f.startsWith('temp-'));
    return uploadedImages
      .filter(img => selectedImageIds.includes(img.id))
      .map(img => ({
        name: img.name,
        url: img.serverUrl, // Use server URL instead of base64
      }));
  };

  const callAi = async (redesignMarkdown?: string) => {
    removePromptStorage();
    // Removed pro/login checks - allow all users
    if (isAiWorking) return;
    if (!redesignMarkdown && !prompt.trim()) return;

    // Build enhanced prompt with template and image info
    const enhancedPrompt = buildEnhancedPrompt(prompt);
    const imageData = getImageDataForApi();

    if (isFollowUp && !redesignMarkdown && !isSameHtml) {
      // Removed login check - allow unauthenticated follow-ups
      const result = await callAiFollowUp(prompt, enhancedSettings, isNew);

      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        setPrompt("");
      }
    } else {
      const result = await callAiNewProject(
        enhancedPrompt,
        enhancedSettings,
        redesignMarkdown,
        !!user,
        imageData // Pass image data to the API
      );

      if (result?.error) {
        handleError(result.error, result.message);
        return;
      }

      if (result?.success) {
        setPrompt("");
        setUploadedImages([]); // Clear uploaded images after successful generation
        setSelectedFiles([]); // Clear selected files
        setSelectedTemplate(null); // Clear selected template
      }
    }
  };

  const handleError = (error: string, message?: string) => {
    switch (error) {
      case "login_required":
        openLoginModal();
        break;
      case "provider_required":
        setOpenProvider(true);
        setProviderError(message || "");
        break;
      case "pro_required":
        openProModal([]);
        break;
      case "api_error":
        toast.error(message || "An error occurred");
        break;
      case "network_error":
        toast.error(message || "Network error occurred");
        break;
      default:
        toast.error("An unexpected error occurred");
    }
  };

  useUpdateEffect(() => {
    if (refThink.current) {
      refThink.current.scrollTop = refThink.current.scrollHeight;
    }
  }, [think]);

  const randomPrompt = () => {
    setRandomPromptLoading(true);
    setTimeout(() => {
      setPrompt(
        PROMPTS_FOR_AI[Math.floor(Math.random() * PROMPTS_FOR_AI.length)]
      );
      setRandomPromptLoading(false);
    }, 400);
  };

  // Show uploaded images preview for new projects
  const hasNewProjectImages = isNew && uploadedImages.length > 0;
  const selectedNewImages = uploadedImages.filter(img =>
    selectedFiles.includes(img.id)
  );

  return (
    <div className="p-3 w-full">
      <div className="relative bg-neutral-800 border border-neutral-700 rounded-2xl ring-[4px] focus-within:ring-neutral-500/30 focus-within:border-neutral-600 ring-transparent z-20 w-full group">
        {think && (
          <div className="w-full border-b border-neutral-700 relative overflow-hidden">
            <header
              className="flex items-center justify-between px-5 py-2.5 group hover:bg-neutral-600/20 transition-colors duration-200 cursor-pointer"
              onClick={() => {
                setOpenThink(!openThink);
              }}
            >
              <p className="text-sm font-medium text-neutral-300 group-hover:text-neutral-200 transition-colors duration-200">
                {isThinking ? "DeepSite is thinking..." : "DeepSite's plan"}
              </p>
              <ChevronDown
                className={classNames(
                  "size-4 text-neutral-400 group-hover:text-neutral-300 transition-all duration-200",
                  {
                    "rotate-180": openThink,
                  }
                )}
              />
            </header>
            <main
              ref={refThink}
              className={classNames(
                "overflow-y-auto transition-all duration-200 ease-in-out",
                {
                  "max-h-[0px]": !openThink,
                  "min-h-[250px] max-h-[250px] border-t border-neutral-700":
                    openThink,
                }
              )}
            >
              <p className="text-[13px] text-neutral-400 whitespace-pre-line px-5 pb-4 pt-3">
                {think}
              </p>
            </main>
          </div>
        )}

        {/* Show selected images for new projects */}
        {selectedNewImages.length > 0 && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-400">Images:</span>
              {selectedNewImages.map((img) => (
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
                    onClick={() => setSelectedFiles(selectedFiles.filter(f => f !== img.id))}
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

        <SelectedFiles
          files={selectedFiles.filter(f => !f.startsWith('temp-'))} // Filter out temp image IDs
          isAiWorking={isAiWorking}
          onDelete={(file) =>
            setSelectedFiles(selectedFiles.filter((f) => f !== file))
          }
        />
        {selectedElement && (
          <div className="px-4 pt-3">
            <SelectedHtmlElement
              element={selectedElement}
              isAiWorking={isAiWorking}
              onDelete={() => setSelectedElement(null)}
            />
          </div>
        )}
        <div className="w-full relative flex items-center justify-between">
          {(isAiWorking || isUploading || isThinking || isLoadingProject) && (
            <div className="absolute bg-neutral-800 top-0 left-4 w-[calc(100%-30px)] h-full z-1 flex items-start pt-3.5 justify-between max-lg:text-sm">
              <AiLoading
                text={
                  isLoadingProject
                    ? "Fetching your project..."
                    : isUploading
                    ? "Uploading images..."
                    : isAiWorking && !isSameHtml
                    ? "DeepSite is working..."
                    : "DeepSite is thinking..."
                }
              />
              {isAiWorking && (
                <Button
                  size="iconXs"
                  variant="outline"
                  className="!rounded-md mr-0.5"
                  onClick={cancelRequest}
                >
                  <CircleStop className="size-4" />
                </Button>
              )}
            </div>
          )}
          <textarea
            disabled={
              isAiWorking || isUploading || isThinking || isLoadingProject
            }
            className={classNames(
              "w-full bg-transparent text-sm outline-none text-white placeholder:text-neutral-400 p-4 resize-none",
              {
                "!pt-2.5":
                  selectedElement &&
                  !(isAiWorking || isUploading || isThinking),
              }
            )}
            placeholder={
              selectedElement
                ? `Ask DeepSite about ${selectedElement.tagName.toLowerCase()}...`
                : selectedTemplate
                ? `Describe your ${selectedTemplate.name.toLowerCase()}...`
                : isFollowUp && (!isSameHtml || pages?.length > 1)
                ? "Ask DeepSite for edits"
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
          {isNew && !isAiWorking && isSameHtml && (
            <Button
              size="iconXs"
              variant="outline"
              className="!rounded-md -translate-y-2 -translate-x-4"
              onClick={() => randomPrompt()}
            >
              <Dice6
                className={classNames("size-4", {
                  "animate-spin animation-duration-500": randomPromptLoading,
                })}
              />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-4 pb-3 mt-2">
          <div className="flex-1 flex items-center justify-start gap-1.5 flex-wrap">
            <PromptBuilder
              enhancedSettings={enhancedSettings!}
              setEnhancedSettings={setEnhancedSettings}
            />
            <Settings
              open={openProvider}
              error={providerError}
              isFollowUp={!isSameHtml && isFollowUp}
              onClose={setOpenProvider}
            />

            {/* Image upload - different component for new vs existing projects */}
            {isNew ? (
              <ImageUploadNew
                uploadedImages={uploadedImages}
                setUploadedImages={setUploadedImages}
                disabled={isAiWorking || isUploading || isThinking}
              />
            ) : (
              <Uploader project={project} />
            )}

            {/* Page templates - only show for new projects */}
            {isNew && isSameHtml && (
              <PageTemplates
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
                disabled={isAiWorking || isUploading || isThinking}
              />
            )}

            {isNew && <ReImagine onRedesign={(md) => callAi(md)} />}
            {!isNew && !isSameHtml && <Selector />}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="iconXs"
              variant="outline"
              className="!rounded-md"
              disabled={
                isAiWorking || isUploading || isThinking || !prompt.trim()
              }
              onClick={() => callAi()}
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <audio ref={hookAudio} id="audio" className="hidden">
        <source src="/success.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
