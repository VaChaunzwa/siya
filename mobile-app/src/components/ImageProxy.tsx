import React, { useState, useEffect } from 'react';
import { Image, ImageProps, Platform } from 'react-native';
import API_BASE_URL from '../services/apiConfig';

interface ImageProxyProps extends ImageProps {
  source: {
    uri: string;
  };
}

const ImageProxy: React.FC<ImageProxyProps> = (props) => {
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const { uri } = props.source;
        if (uri && (uri.includes('storage.googleapis.com') || uri.includes('firebasestorage.googleapis.com') || uri.includes('firebasestorage.app'))) {
          const proxyUrl = `${API_BASE_URL.replace(/\/api$/, '')}/proxy-image?url=${encodeURIComponent(uri)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = () => {
              setImageUri(reader.result as string);
            };
            reader.readAsDataURL(blob);
          } else {
            console.error('Failed to fetch image from proxy');
            setImageUri(uri); // Fallback to direct URL
          }
        } else {
          setImageUri(uri);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
        setImageUri(props.source.uri); // Fallback to direct URL
      }
    };

    fetchImage();
  }, [props.source.uri]);

  if (!imageUri) {
    return null; // Or a placeholder
  }

  return <Image {...props} source={{ uri: imageUri }} />;
};

export default ImageProxy;