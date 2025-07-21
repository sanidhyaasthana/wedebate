"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function JoinDebateByKeyPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const joinKey = params.join_key as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const findDebate = async () => {
      const { data, error } = await supabase
        .from("debates")
        .select("id")
        .eq("join_key", joinKey)
        .single();
      if (error || !data) {
        setError("Debate not found or join link is invalid.");
        setLoading(false);
        return;
      }
      router.replace(`/debate/${data.id}`);
    };
    findDebate();
  }, [joinKey, router, supabase]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">Error</h2>
          <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/debate")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            Back to Debates
          </button>
        </div>
      </div>
    );
  }

  return null;
}