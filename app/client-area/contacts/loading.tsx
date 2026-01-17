import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Image
            src="/database.png"
            alt="Loading"
            width={64}
            height={64}
            className="animate-pulse"
          />
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin -z-10"></div>
        </div>
        <p className="text-sm text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
