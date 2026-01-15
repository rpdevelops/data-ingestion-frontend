"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { IconUpload, IconFileText, IconX } from "@tabler/icons-react";
import { uploadCSV } from "@/actions/jobs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UploadCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadCSVModal({ open, onOpenChange }: UploadCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      toast.error("Invalid file type", {
        description: "Please select a CSV file (.csv extension required)",
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      toast.error("File too large", {
        description: "File size must be less than 5MB",
      });
      return;
    }

    if (selectedFile.size === 0) {
      toast.error("Empty file", {
        description: "File cannot be empty",
      });
      return;
    }

    setFile(selectedFile);
    toast.success("File selected", {
      description: selectedFile.name,
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("No file selected", {
        description: "Please select a file first",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData to pass to Server Action
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await uploadCSV(formData);
      toast.success("File uploaded successfully", {
        description: `${response.message} (Job ID: ${response.job_id})`,
        duration: 5000,
      });
      
      // Close modal and refresh the page
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      // Handle different types of errors
      let errorTitle = "Upload failed";
      let errorDescription = "Failed to upload file. Please try again.";
      
      if (err instanceof Error) {
        errorDescription = err.message;
        
        // Provide more specific error titles based on error message
        if (err.message.includes("Authentication")) {
          errorTitle = "Authentication error";
        } else if (err.message.includes("permission")) {
          errorTitle = "Permission denied";
        } else if (err.message.includes("already been uploaded") || err.message.includes("duplicate")) {
          errorTitle = "File already exists";
        } else if (err.message.includes("too large") || err.message.includes("size")) {
          errorTitle = "File too large";
        } else if (err.message.includes("Invalid file type") || err.message.includes("CSV")) {
          errorTitle = "Invalid file type";
        } else if (err.message.includes("Server error") || err.message.includes("500")) {
          errorTitle = "Server error";
        }
      }
      
      toast.error(errorTitle, {
        description: errorDescription,
        duration: 6000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setIsDragging(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Upload CSV File</SheetTitle>
          <SheetDescription>
            Select or drag a CSV file to upload for processing. Maximum file size: 5MB
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* File Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : file
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />

            {!file ? (
              <div className="space-y-4">
                <IconUpload className="h-12 w-12 mx-auto text-gray-400" />
                <div className="-flex flex-row">
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer justify-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Click to select a file
                  </Label>
                  <p className="text-sm text-gray-500 mt-2">or drag and drop here</p>
                </div>
                <p className="text-xs text-gray-400">
                  CSV files only, max 5MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <IconFileText className="h-12 w-12 mx-auto text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  className="mt-2"
                >
                  <IconX className="h-4 w-4 mr-2" />
                  Remove File
                </Button>
              </div>
            )}
          </div>

        </div>

        <SheetFooter className="mt-6 flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="min-w-[120px]"
          >
            {isUploading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Uploading...
              </>
            ) : (
              <>
                <IconUpload className="h-4 w-4 mr-2" />
                Upload File
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
