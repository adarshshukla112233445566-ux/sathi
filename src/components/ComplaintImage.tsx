import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { getComplaintImageUrl } from "@/services/ai";

interface ComplaintImageProps {
  path: string | null | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

export function ComplaintImage({ path, alt, className = "", placeholderClassName = "" }: ComplaintImageProps) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl("");
    setFailed(false);
    if (!path) return () => { active = false; };
    if (/^https?:\/\//i.test(path)) {
      setUrl(path);
      return () => { active = false; };
    }

    getComplaintImageUrl(path)
      .then((signedUrl) => {
        if (active) setUrl(signedUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => { active = false; };
  }, [path]);

  if (!url || failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 text-gray-400 ${placeholderClassName || className}`}>
        <ImageIcon className="h-7 w-7" />
        <span className="mt-1 text-xs">No photo</span>
      </div>
    );
  }

  return <img src={url} alt={alt} className={className} onError={() => setFailed(true)} />;
}
