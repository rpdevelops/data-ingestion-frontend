import { LoginForm } from "@/components/login-form";
import Link from "next/link";
import { Database } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-white font-bold text-lg">DI</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold text-gray-900 leading-tight">
                Data Ingestion <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Tool</span>
              </span>
              <span className="text-xs text-gray-500 -mt-1">Data Processing Platform</span>
            </div>
          </Link>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
