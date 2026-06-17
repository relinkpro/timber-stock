"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhotoUpload from "@/app/components/PhotoUpload";

export default function ScanPhoto({
  itemId,
  imageUrl,
}: {
  itemId: string;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(imageUrl);

  return (
    <div className="card">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="product-photo" src={url} alt="Product photo" />
      ) : (
        <div className="photo-empty">No photo yet</div>
      )}
      <PhotoUpload
        itemId={itemId}
        hasImage={!!url}
        onUploaded={(item) => {
          setUrl(item?.image_url ?? null);
          router.refresh();
        }}
      />
    </div>
  );
}
