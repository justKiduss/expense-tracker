'use client'

import { useState } from "react"
import { useRouter } from "next/navigation";

async function post (url:string, data:unknown){
    return fetch(url, {
        method:'POST',
        headers: {'Content-Type':'applicaion/json'},
        body:JSON.stringify(data),
    });
}

async function errorMessage(res:Response){
    const data=await res.json().catch(()=> null);
    return data?.error ?? 'Something went wrong';
}

export default function AuthForm({mode}:{mode:'login'|'signup'}){
    const router=useRouter();
    const [error,setError]=useState<string | null>(null);
    const [loading,setLoading]=useState(false);


    async function onSubmit(e:React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        setError(null);
        setLoading(true);

        const form=new FormData(e.currentTarget);
        const payload={email:String(form.get('email')),password:String(form.get('password')) };

        try{
            if(mode === 'signup'){
                const res=await post('/api/auth/signup',payload);
                if(!res.ok) return setError(await errorMessage(res));
            }

            const res=await post('/api/auth/login',payload);
            if(!res.ok) return setError(await errorMessage(res));

            router.push('/dashboard');
            router.refresh();
             } catch {
            setError('Network error, try again');
            } finally {
            setLoading(false);
            }

        }
        return(
             <form onSubmit={onSubmit} className="mx-auto mt-24 flex w-full max-w-sm flex-col gap-4 p-6">
                <h1 className="text-2xl font-semibold">{mode === 'login' ? 'Log in' : 'Create account'}</h1>
                <input name="email" type="email" placeholder="Email" required className="rounded border p-2 text-white" />
                <input
                    name="password" type="password" placeholder="Password (8+ characters)"
                    required minLength={8} maxLength={72} className="rounded border p-2 text-white"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button disabled={loading} className="rounded bg-blue-600 p-2 text-white disabled:opacity-50">
                    {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
                </button>
                <a href={mode === 'login' ? '/signup' : '/login'} className="text-sm underline">
                    {mode === 'login' ? 'Need an account? Sign up' : 'Already registered? Log in'}
                </a>
            </form>
        )
    }