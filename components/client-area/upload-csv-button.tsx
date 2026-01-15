"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconUpload } from "@tabler/icons-react";
import { UploadCSVModal } from "./upload-csv-modal";

export function UploadCSVButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-md"
      >
        <IconUpload className="h-4 w-4 mr-2" />
        Upload CSV
      </Button>
      <UploadCSVModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
