import { parseSms }  from "./parser.ts"

const body = `Dear Test
You have transferred ETB 130.00 to Person B (0922****01) on 29/09/2026 16:50:06. Your transaction number is DIT00AAA03. The service fee is  ETB 1.74 and  15% VAT on the service fee is ETB 0.26. Your current E-Money Account  balance is ETB 1.40.`;

const result = parseSms({ body, receivedAt: new Date() });
console.log(result);