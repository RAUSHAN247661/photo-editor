
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface ImageUploadProps {
  onImageUpload: (file: File, imageUrl: string) => void;
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    // Check if the file is an image
    if (!file.type.match('image.*')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Create an object URL directly to display image immediately
    // We'll use both methods for reliability
    const objectUrl = URL.createObjectURL(file);
    
    // Also use FileReader as backup and for more compatibility
    const reader = new FileReader();
    reader.onload = () => {
      // When FileReader is done, we already have the objectUrl ready
      // so we can proceed with the upload
      onImageUpload(file, objectUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      });
      
      setIsLoading(false);
    };
    
    reader.onerror = () => {
      // If FileReader fails, we still have objectUrl as fallback
      onImageUpload(file, objectUrl);
      setIsLoading(false);
    };
    
    // Start the reading process (asynchronous)
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-primary/30 dark:bg-[#131622]/50 bg-background/50 backdrop-blur-sm"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-primary/10 p-4">
          <Upload className={`h-8 w-8 text-primary ${isLoading ? "animate-spin" : ""}`} />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-xl">Upload an image</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {isLoading ? "Processing your image..." : "Drag and drop your image here, or click to browse from your computer"}
          </p>
        </div>
        
        <div className="mt-2">
          <Button className="relative" disabled={isLoading}>
            {isLoading ? "Processing..." : "Choose File"}
            <input
              type="file"
              className={`absolute inset-0 w-full h-full opacity-0 ${isLoading ? "cursor-not-allowed" : "cursor-pointer"}`}
              onChange={handleFileChange}
              accept="image/*"
              disabled={isLoading}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
