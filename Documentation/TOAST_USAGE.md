# Toast/Notification Component Usage Guide

The application now has a global notification system using shadcn/ui toast components. Notifications appear at the top-right corner of the screen.

## Basic Usage

### In any React component:

```tsx
"use client";

import { useToast } from "@/lib/use-toast";
import { Button } from "@/components/ui/button";

export function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: "Success!",
      description: "Your action was completed successfully.",
      variant: "success",
    });
  };

  const handleError = () => {
    toast({
      title: "Error!",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  };

  const handleWarning = () => {
    toast({
      title: "Warning",
      description: "Please be careful with this action.",
      variant: "warning",
    });
  };

  const handleDefault = () => {
    toast({
      title: "Notification",
      description: "This is a default notification.",
    });
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleSuccess}>Show Success</Button>
      <Button onClick={handleError}>Show Error</Button>
      <Button onClick={handleWarning}>Show Warning</Button>
      <Button onClick={handleDefault}>Show Default</Button>
    </div>
  );
}
```

## Available Variants

- **default**: Gray/neutral background
- **success**: Green background with success styling
- **warning**: Yellow background with warning styling
- **destructive**: Red background for errors/errors

## Toast Options

```typescript
toast({
  title: "Toast Title",              // Optional: Main heading
  description: "Toast description",  // Optional: Description text
  variant: "default",                // Optional: Visual variant
  action: <Button>Undo</Button>,    // Optional: Action button
  open: true,                        // Optional: Initially open (default true)
  onOpenChange: (open) => {},       // Optional: Callback when state changes
});
```

## Return Value

The `toast()` function returns an object with utilities:

```typescript
const toastInstance = toast({...});

// Properties:
toastInstance.id;       // Unique toast ID (string)
toastInstance.dismiss;  // Function to dismiss the toast
toastInstance.update;   // Function to update toast properties
```

## Examples

### Success Notification (File Upload Completed)
```tsx
const { toast } = useToast();

const handleFileUpload = async () => {
  try {
    // ... upload file
    toast({
      title: "Upload Successful",
      description: "File uploaded successfully",
      variant: "success",
    });
  } catch (error) {
    toast({
      title: "Upload Failed",
      description: error.message,
      variant: "destructive",
    });
  }
};
```

### Warning with Action Button
```tsx
const { toast } = useToast();

const { dismiss } = toast({
  title: "Delete Item?",
  description: "This action cannot be undone.",
  variant: "warning",
  action: (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => {
        // Handle delete action
        dismiss();
      }}
    >
      Delete
    </Button>
  ),
});
```

### Image Generation Feedback (Text2Image Component Example)
```tsx
"use client";
import { useToast } from "@/lib/use-toast";

export function Text2Image() {
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      // Show loading state
      toast({
        title: "Generating Image...",
        description: "Please wait while we create your image.",
      });

      const image = await puter.ai.txt2img(prompt, { model, quality });
      
      // Show success
      toast({
        title: "Image Generated!",
        description: "Your image is ready.",
        variant: "success",
      });
      
      setGeneratedImage(image.src);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (/* ... */);
}
```

## Styling & Customization

Toasts automatically respect your app's theme (light/dark mode) and appear in the top-right corner on all screen sizes.

The component is responsive:
- Mobile: Stacks from bottom to top on small screens
- Desktop: Fixes to top-right corner on larger screens

## Integration Points

The `<Toaster />` component is already integrated in `app/page.tsx`, so it's available globally across all sections of your application (Chat, Workers, Files, Text2Image, etc.).
