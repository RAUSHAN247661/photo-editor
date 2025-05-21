
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ImageEditor } from "@/components/ImageEditor";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (file: File, imageUrl: string) => {
    setIsLoading(true);
    
    // Set the file and image URL state
    setUploadedFile(file);
    setUploadedImage(imageUrl);
    
    // Immediately transition to editor mode
    setIsLoading(false);
  };

  const handleBackToUpload = () => {
    setUploadedImage(null);
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors dark:bg-[#0f1117] bg-background">
      <Helmet>
        <title>ImageCraft - Free Online Photo Editor | Edit Images Easily</title>
        <meta name="description" content="Edit your images online for free with ImageCraft. Add text, filters, apply borders, crop, rotate, and create circular profile pictures for social media. No signup required." />
        <meta name="keywords" content="image editor, photo editor, online editor, free, crop image, resize image, text on image, circular crop, profile picture maker, social media images" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://imagecraft.app/" />
        <meta property="og:title" content="ImageCraft - Free Online Photo Editor" />
        <meta property="og:description" content="Edit your images online for free. Add text, filters, borders, and more. No signup required." />
        <meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ImageCraft - Free Online Photo Editor" />
        <meta name="twitter:description" content="Edit your images online for free. Add text, filters, borders, and more. No signup required." />
        <meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
        
        {/* Canonical link */}
        <link rel="canonical" href="https://imagecraft.app/" />
      </Helmet>
      
      <header className="border-b sticky top-0 z-10 bg-background/80 backdrop-blur-lg dark:border-gray-800">
        <div className="container py-3 md:py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 text-transparent bg-clip-text">
            ImageCraft
          </h1>

          <div className="flex items-center gap-2 md:gap-4">
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
              Free online image editor
            </p>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 py-4 md:py-6 px-3 md:px-8 container">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/30"></div>
                <div className="text-lg text-muted-foreground">Loading your image...</div>
              </div>
            </div>
          ) : !uploadedImage ? (
            <>
              <section className="mb-8 md:mb-12 text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 md:mb-4 dark:text-white">
                  Edit your images with ease
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Upload, edit, and download your images instantly with our powerful yet simple editor.
                </p>
              </section>

              <div className="animate-fade-in">
                <ImageUpload onImageUpload={handleImageUpload} />
              </div>
              
              {/* SEO Content */}
              <section className="mt-12 md:mt-16 text-left max-w-3xl mx-auto">
                <h2 className="text-xl md:text-2xl font-bold mb-4">Free Online Image Editor</h2>
                <p className="mb-4 text-muted-foreground">
                  ImageCraft is a powerful yet easy-to-use online image editor that helps you enhance your photos in seconds. 
                  Whether you need to create perfect profile pictures for social media, add text to your images, 
                  or apply professional filters, ImageCraft has you covered.
                </p>
                
                <h3 className="text-lg md:text-xl font-semibold mt-6 mb-2">Key Features</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm md:text-base text-muted-foreground">
                  <li>Create circular profile pictures for social media</li>
                  <li>Add text with custom fonts, colors and positioning</li>
                  <li>Apply professional filters and effects</li>
                  <li>Crop, rotate, and resize your images</li>
                  <li>Add custom borders with gradient colors</li>
                  <li>Platform-specific presets for social media</li>
                  <li>Download edited images instantly</li>
                </ul>
                
                <h3 className="text-lg md:text-xl font-semibold mt-6 mb-2">How It Works</h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm md:text-base text-muted-foreground">
                  <li>Upload your image from your device</li>
                  <li>Use our intuitive tools to edit your image</li>
                  <li>Preview your changes in real-time</li>
                  <li>Download your edited image</li>
                </ol>
                
                <p className="mt-6 text-muted-foreground">
                  Best of all, ImageCraft is completely free to use and works entirely in your browser. 
                  Your images never leave your device, ensuring complete privacy and security.
                </p>
              </section>
            </>
          ) : (
            <div className="animate-fade-in">
              <ImageEditor 
                imageUrl={uploadedImage} 
                onBackToUpload={handleBackToUpload}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-4 md:py-6 bg-muted/40 dark:bg-[#0b0d14] dark:border-gray-800">
        <div className="container text-center text-xs md:text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ImageCraft. All rights reserved.</p>
          <p className="mt-1">A fully client-side image editor. Your images never leave your device.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
