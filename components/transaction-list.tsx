import type {transations} from '@/lib/db/schema'
import { formatBirr,formatDate } from '@/lib/format'

type Tx = typeof transations.$inferSelect;

export default function TransactionList({items}:{items:Tx[]}) {
    if(items.length === 0){
        return <p className='mt-6 text-sm opacacity-70'>No transactions yet. paste as sms above. </p>
    }

    return (
        <ul className='mt-6 divide-y rounded border'>
            {items.map((t)=>(
                <li key={t.id} className='flex items-center justify-center gap-4 p-3'>
                    <div className='min-w-0'>
                        <p className='truncate font-medium'>{t.counterparty?? t.description??t.kind}</p>
                        <p className='text-xs opacity-70'>
                            {formatDate(t.occurredAt)} . {t.kind}
                            {t.needsReview && ' . needs review'}
                        </p>
                    </div>
                    <div className='text-right'>
                        <p className={t.direction === 'in'? 'text-green-500':'text-red-500'}>
                            {t.direction==='in'?'+':'-'}{formatBirr(t.amount)}
                        </p>
                        {t.fee > 0 && <p className='text-xs opacity-70'>fee {formatBirr(t.fee)}</p>}
                    </div>
                </li>
            ))}
        </ul>
    )

}