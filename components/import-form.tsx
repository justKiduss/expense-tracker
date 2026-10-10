'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

const MESSAGES: Record<string, string>={
    created:'Saved.',
    duplicate:'Already imported, nothing changed.',
    ignored:'Recognized, but it is not a transation (for example a notice).',
    unknown:'Counld not recognse this message format.',
};

export default function ImportForm(){
    const router=useRouter();
    const [text,setText]=useState('');
    const [loading,setLoading]=useState(false);
    const [result,setResult]=useState<{ok:boolean;text:string} | null>(null);

    async function onSubmit(e:React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try{
            const res=await fetch('/api/transactions/import',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({body:text,receivedAt:new Date().toISOString() }),
            });
            if(res.status === 401) return router.push('/login');
            const data=await res.json().catch(()=> null);
            const status:string | undefined =data?.status;
            setResult({ok:status === 'created', text :(status && MESSAGES[status]) ?? data?.error ?? 'Somethings went wrong '});

            if (status === 'created'){
                setText('');
                router.refresh();
            }
        }catch{
            setResult({ok:false, text:'Network error, try again'});
        }finally{
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
            <textarea 
                value={text}
                onChange={(e)=>setText(e.target.value)}
                placeholder="Paste a CBE or telebirr SMS here"
                rows={4}
                required
                maxLength={2000}
                className="rounded border p-2 text-white" />

            <button disabled={loading || !text.trim()} className="self-start rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                {loading ? 'Importing...':'Import'}
            </button>
            {result && <p className={`text-sm ${result.ok ? 'text-green-500':'text-yellow-500'}`}>{result.text}</p>}
        </form>
    )
}