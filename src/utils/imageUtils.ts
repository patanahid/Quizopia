/**
 * Extracts base64 images from markdown text and returns a map of placeholders to image data
 * @param text Markdown text containing base64 images
 * @returns An object with extracted images and the modified text with placeholders
 */
export function extractBase64Images(text: string) {
  if (!text) return { text: "", images: {} };

  // This regex matches markdown image syntax with base64 data
  const regex = /!\[(.*?)\]\((data:image\/[a-z]+;base64,[^\)]+)\)/g;
  const images: Record<string, string> = {};
  let match;
  let modifiedText = text;
  let index = 0;

  // Extract all base64 images and replace them with placeholders
  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, altText, imageData] = match;
    const placeholder = `__IMAGE_${index}__`;
    
    // Store the image data with its placeholder
    images[placeholder] = imageData;
    
    // Replace the base64 image in text with a placeholder
    modifiedText = modifiedText.replace(fullMatch, `![${altText}](${placeholder})`);
    
    index++;
  }

  return {
    text: modifiedText,
    images
  };
}

/**
 * Renders an image with the given src (which might be a placeholder)
 * @param src Image source or placeholder
 * @param alt Alt text for the image
 * @param images Map of image placeholders to their base64 data
 * @returns The actual image src to use
 */
export function getImageSrc(src: string | undefined, images: Record<string, string>) {
  if (!src) return undefined;
  
  // If the src is a placeholder, use the corresponding base64 data
  if (src.startsWith('__IMAGE_') && src.endsWith('__')) {
    return images[src];
  }
  
  // Otherwise, return the src as is
  return src;
} 