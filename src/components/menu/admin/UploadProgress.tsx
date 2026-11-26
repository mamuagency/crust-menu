import { useUploads } from "@/lib/menu/uploadProgress";

export function UploadProgress() {
  const uploads = useUploads();
  if (uploads.length === 0)
    return <div className="fixed top-4 right-4 z-[9999] rounded bg-red-600 p-3 text-white">TEST BOX</div>;

  const done = uploads.filter((u) => u.status === "done").length;
  const hasError = uploads.some((u) => u.status === "error");

  return (
<div className="fixed top-4 right-4 z-[9999] w-72 rounded-lg border border-white/10 bg-[#0b1226] p-4 text-white shadow-2xl">
      <p className="mb-3 text-sm font-semibold">
        {hasError ? "Upload failed" : done === uploads.length ? "All saved ✓" : `Uploading ${done}/${uploads.length}`}
      </p>
      <div className="space-y-3">
        {uploads.map((u) => (
          <div key={u.id}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="max-w-[170px] truncate">{u.name}</span>
              <span>{u.status === "error" ? "Error" : `${u.percent}%`}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded bg-white/10">
              <div
                className={`h-full transition-all duration-200 ${
                  u.status === "error" ? "bg-red-500" : u.status === "done" ? "bg-green-500" : "bg-[#c89b6b]"
                }`}
                style={{ width: `${u.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
