"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageSquare, Clock, CheckCircle2, XCircle } from "lucide-react";
import { getAccessToken, getUser } from "@/lib/auth";

export default function MyQueriesPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueries = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/contact/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setQueries(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchQueries();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-green-700" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/contact" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Queries</h1>
            <p className="text-gray-500 text-sm mt-1">View your submitted queries and responses</p>
          </div>
        </div>

        {queries.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No queries yet</p>
            <Link
              href="/contact"
              className="inline-block mt-4 text-green-700 font-medium text-sm hover:underline"
            >
              Send a message
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {queries.map((q) => (
              <div key={q.id} className="border border-gray-200 rounded-xl p-5 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {new Date(q.created_at).toLocaleDateString("en-IN", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                  {q.response ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 size={14} /> Replied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <XCircle size={14} /> Awaiting reply
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{q.message}</p>

                {q.response && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Response</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.response}</p>
                    {q.responded_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(q.responded_at).toLocaleDateString("en-IN", {
                          year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
