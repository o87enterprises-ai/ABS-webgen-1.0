import { useState } from "react";
import {
  LayoutTemplate,
  Home,
  Info,
  Mail,
  ShoppingCart,
  FileText,
  Users,
  Settings,
  HelpCircle,
  Briefcase,
  Image,
  Calendar,
  Check,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface PageTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  pages: string[];
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "landing",
    name: "Landing Page",
    icon: <Home className="size-4" />,
    description: "Single page with hero, features, pricing, CTA",
    pages: ["index.html"],
  },
  {
    id: "business",
    name: "Business Website",
    icon: <Briefcase className="size-4" />,
    description: "Home, About, Services, Contact pages",
    pages: ["index.html", "about.html", "services.html", "contact.html"],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    icon: <Image className="size-4" />,
    description: "Showcase work with projects gallery",
    pages: ["index.html", "projects.html", "about.html", "contact.html"],
  },
  {
    id: "blog",
    name: "Blog",
    icon: <FileText className="size-4" />,
    description: "Blog listing and article pages",
    pages: ["index.html", "blog.html", "article.html", "about.html"],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    icon: <ShoppingCart className="size-4" />,
    description: "Product catalog with cart functionality",
    pages: ["index.html", "products.html", "product-detail.html", "cart.html", "checkout.html"],
  },
  {
    id: "saas",
    name: "SaaS Product",
    icon: <Settings className="size-4" />,
    description: "Product landing with pricing and features",
    pages: ["index.html", "features.html", "pricing.html", "contact.html"],
  },
  {
    id: "documentation",
    name: "Documentation",
    icon: <HelpCircle className="size-4" />,
    description: "Docs with sidebar navigation",
    pages: ["index.html", "getting-started.html", "api-reference.html", "examples.html"],
  },
  {
    id: "event",
    name: "Event/Conference",
    icon: <Calendar className="size-4" />,
    description: "Event landing with schedule and speakers",
    pages: ["index.html", "schedule.html", "speakers.html", "register.html"],
  },
  {
    id: "team",
    name: "Team/Agency",
    icon: <Users className="size-4" />,
    description: "Team showcase with case studies",
    pages: ["index.html", "team.html", "work.html", "contact.html"],
  },
];

interface PageTemplatesProps {
  selectedTemplate: PageTemplate | null;
  onSelectTemplate: (template: PageTemplate | null) => void;
  disabled?: boolean;
}

export const PageTemplates = ({
  selectedTemplate,
  onSelectTemplate,
  disabled
}: PageTemplatesProps) => {
  const [open, setOpen] = useState(false);

  const handleSelectTemplate = (template: PageTemplate) => {
    if (selectedTemplate?.id === template.id) {
      onSelectTemplate(null);
    } else {
      onSelectTemplate(template);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="xs"
          variant={selectedTemplate ? "default" : "outline"}
          className="!rounded-md gap-1.5"
          disabled={disabled}
        >
          <LayoutTemplate className="size-3.5" />
          {selectedTemplate ? selectedTemplate.name : "Templates"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="!rounded-2xl !p-0 !bg-white !border-neutral-100 w-[380px] overflow-hidden"
      >
        <header className="bg-neutral-50 p-4 border-b border-neutral-200/60">
          <p className="text-lg font-semibold text-neutral-950">
            Page Templates
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Choose a template to generate multiple pages at once
          </p>
        </header>
        <main className="max-h-[400px] overflow-y-auto p-3">
          <div className="grid gap-2">
            {PAGE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`
                  w-full text-left p-3 rounded-xl border-2 transition-all
                  ${selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    size-10 rounded-lg flex items-center justify-center
                    ${selectedTemplate?.id === template.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-neutral-100 text-neutral-600'}
                  `}>
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-neutral-900">{template.name}</p>
                      {selectedTemplate?.id === template.id && (
                        <Check className="size-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{template.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.pages.map((page) => (
                        <span
                          key={page}
                          className="text-xs px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600"
                        >
                          {page}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </main>
        {selectedTemplate && (
          <footer className="p-3 border-t border-neutral-200 bg-neutral-50">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onSelectTemplate(null);
                setOpen(false);
              }}
            >
              Clear Selection
            </Button>
          </footer>
        )}
      </PopoverContent>
    </Popover>
  );
};
