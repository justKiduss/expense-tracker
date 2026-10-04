"use client"
import { parseSms,type ParseResult } from "@/lib/sms-parser/parser";
import { useState } from "react";

export default function Home() {
  const [text,setText]=useState("");
  const [result,setResult]=useState<ParseResult | null>(null);


  const handleSend=()=>{
    setResult(
      parseSms({
        body:text,
        receivedAt:new Date(),
      })
    )
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className='w-full max-w-lg bg-white p-8 shadow-lg rounded-2xl'>
          <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">Expense Tracker</h1>

          <div className="space-y-4">
            <textarea placeholder="Paste an SMS into the box..." className="h-40 w-full resize-none rounded-xl border border-gray-300 p-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={text} onChange={(e)=>setText(e.target.value)}/>
            <button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99]" onClick={handleSend}> 
                Send 
             </button>
             {result && (
              <pre className="overflow-auto rounded-xl bg-gray-900 p-4 text-sm text-white">
                {JSON.stringify(result, null, 2)}
              </pre>
             )}
          </div>
      </div>
    </div>
  );
}
